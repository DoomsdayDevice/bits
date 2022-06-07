import { Type } from '@nestjs/common';
import * as _ from 'lodash';
import { memoize, upperFirst } from 'lodash';
import { grpcEnums } from '../../decorators/decorators';
import { GrpcFieldDef } from '../../decorators/field.decorator';
import { getFieldDataForClass, GrpcMessageDef } from '../../decorators/message.decorator';
import {
  GrpcBooleanFieldComparisons,
  GrpcStringFieldComparison,
  IGrpcFilter,
} from '@bits/grpc/grpc-filter.interface';
import { Merge } from 'ts-toolbelt/out/Union/Merge';

export type IListValue<T> = {
  values: T[];
};

export const getListValueOfCls = memoize(<T>(Cls: Type<T> | string) => {
  const name = upperFirst((Cls as any).name || Cls);
  @GrpcMessageDef({ name: `${name}ListValue` })
  class InArray {
    @GrpcFieldDef(() => [Cls] as any)
    values: T[];
  }

  return InArray;
});

const StringListValue = getListValueOfCls(String);

// @GrpcMessageDef({ oneOf: true })
// export class CommonFieldComparison {}

@GrpcMessageDef({ oneOf: true })
export class BooleanFieldComparison implements Merge<GrpcBooleanFieldComparisons> {
  @GrpcFieldDef()
  is: boolean;

  @GrpcFieldDef()
  isNot: boolean;
}

@GrpcMessageDef({ oneOf: true })
export class StringFieldComparison
  extends BooleanFieldComparison
  implements Merge<GrpcStringFieldComparison>
{
  @GrpcFieldDef(() => StringListValue)
  in: IListValue<string>;

  @GrpcFieldDef()
  eq: string;

  @GrpcFieldDef()
  neq: string;

  @GrpcFieldDef()
  like: string;

  @GrpcFieldDef()
  gt: string;

  @GrpcFieldDef()
  gte: string;

  @GrpcFieldDef()
  lt: string;

  @GrpcFieldDef()
  lte: string;

  @GrpcFieldDef()
  iLike: string;

  @GrpcFieldDef()
  notLike: string;

  @GrpcFieldDef()
  notILike: string;
}

@GrpcMessageDef({ oneOf: true })
export class DateFieldComparison extends BooleanFieldComparison {
  @GrpcFieldDef()
  eq: Date;

  @GrpcFieldDef()
  neq: Date;
}

export const getEnumComparisonType = memoize(function <E>(Enum: E, enumName: string): any {
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

export const getOrCreateDefaultFilter = memoize(<M>(ModelCls: Type<M>): Type<IGrpcFilter<M>> => {
  // get filterable fields TODO make a separate function to get fields and filterable fields
  const foundFields = getFieldDataForClass(ModelCls);
  const filterable = foundFields.filter(f => f.filterable);

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
      const enumComp = getEnumComparisonType(
        grpcEnums.find(e => e.name === enumName),
        enumName,
      );
      filterTypeFn = () => enumComp;
    }
    GrpcFieldDef(filterTypeFn, { name: f.name, filterable: f.filterable, nullable: true })(
      GenericFilter.prototype,
      f.name,
    );
  }

  GrpcMessageDef({ name: `${ModelCls.name}Filter` })(GenericFilter);
  return GenericFilter as any;
});
