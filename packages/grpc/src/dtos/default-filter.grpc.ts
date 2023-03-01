import { Type } from "@nestjs/common";
import * as _ from "lodash";
import { memoize } from "lodash";
import {
  getFieldDataForClass,
  getListValueOfCls,
  GrpcFieldDef,
  GrpcMessageDef,
} from "../decorators";
import {
  GrpcBooleanFieldComparisons,
  GrpcStringFieldComparison,
  IGrpcFilter,
  IListValue,
} from "@bits/core";
import { grpcEnums } from "../constants";
import * as Toolbelt from "ts-toolbelt";

// @GrpcMessageDef({ oneOf: true })
// export class CommonFieldComparison {}

@GrpcMessageDef({ oneOf: true })
export class BooleanFieldComparison
  implements Toolbelt.Union.Merge<GrpcBooleanFieldComparisons>
{
  @GrpcFieldDef()
  is!: boolean;

  @GrpcFieldDef()
  isNot!: boolean;
}

@GrpcMessageDef({ oneOf: true })
export class StringFieldComparison
  extends BooleanFieldComparison
  implements Toolbelt.Union.Merge<GrpcStringFieldComparison>
{
  @GrpcFieldDef(() => getListValueOfCls(String))
  in!: IListValue<string>;

  @GrpcFieldDef()
  eq!: string;

  @GrpcFieldDef()
  neq!: string;

  @GrpcFieldDef()
  like!: string;

  @GrpcFieldDef()
  gt!: string;

  @GrpcFieldDef()
  gte!: string;

  @GrpcFieldDef()
  lt!: string;

  @GrpcFieldDef()
  lte!: string;

  @GrpcFieldDef()
  iLike!: string;

  @GrpcFieldDef()
  notLike!: string;

  @GrpcFieldDef()
  notILike!: string;
}

@GrpcMessageDef({ oneOf: true })
export class DateFieldComparison extends BooleanFieldComparison {
  @GrpcFieldDef()
  eq!: Date;

  @GrpcFieldDef()
  neq!: Date;
}

export const getEnumComparisonType = memoize(function <E>(
  Enum: E,
  enumName: string
): any {
  const msgName = `${_.upperFirst(enumName)}FieldComparison`;
  const EnumInArr = getListValueOfCls(enumName);
  @GrpcMessageDef({ name: msgName, oneOf: true })
  class EnumComparison {
    @GrpcFieldDef(() => EnumInArr)
    in!: E[];

    @GrpcFieldDef(() => enumName)
    eq!: E;
  }

  return EnumComparison;
});

export const getArrayComparisonType = function <E>(Cls: Type<E>) {
  const msgName = `${_.upperFirst(Cls.name)}ArrayComparison`;

  @GrpcMessageDef({ name: msgName })
  class ArrayComparison {
    @GrpcFieldDef(() => getOrCreateDefaultFilter(Cls))
    elemMatch!: E;
  }

  return ArrayComparison;
};

export const getOrCreateDefaultFilter = memoize(
  <M, Enums>(ModelCls: Type<M>): Type<IGrpcFilter<M, Enums>> => {
    // get filterable fields TODO make a separate function to get fields and filterable fields
    const foundFields = getFieldDataForClass(ModelCls);
    const filterable = foundFields.filter((f) => f.filterable);

    class GenericFilter {}
    // GrpcFieldDef({ nullable: true })(GenericFilter, 'username');

    for (const f of filterable) {
      let filterTypeFn;
      if (f.typeFn() === String) {
        filterTypeFn = () => StringFieldComparison;
      } else if (f.typeFn() === Date) {
        filterTypeFn = () => DateFieldComparison;
      } else if (f.typeFn() === Boolean) {
        filterTypeFn = () => BooleanFieldComparison;
      } else {
        const enumName = f.typeFn();
        const foundEnum = grpcEnums.find((e) => e.name === enumName);
        if (foundEnum) {
          const enumComp = getEnumComparisonType(foundEnum, enumName);
          filterTypeFn = () => enumComp;
        } else {
          let t: any;
          const type = f.typeFn();
          if (f.rule === "repeated") {
            t = getOrCreateDefaultFilter(type);
          }
          if (f.listValue) {
            t = getArrayComparisonType(f.typeFn());
          }
          filterTypeFn = () => t;
        }
      }
      GrpcFieldDef(filterTypeFn, {
        name: f.name,
        filterable: f.filterable,
        nullable: true,
      })(GenericFilter.prototype, f.name);
    }
    // TODO get model name from metadata
    for (const name of ["_and", "_or"])
      GrpcFieldDef(() => [`${ModelCls.name}Filter`], { name, nullable: true })(
        GenericFilter.prototype,
        name
      );

    GrpcMessageDef({ name: `${ModelCls.name}Filter` })(GenericFilter);

    return GenericFilter as any;
  }
);
