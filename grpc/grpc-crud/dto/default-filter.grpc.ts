import { Type } from '@nestjs/common';
import { Filter } from '../grpc-controller.interface';
import { fieldReflector, grpcEnums } from '../../decorators/decorators';
import { GrpcFieldDef } from '../../decorators/field.decorator';
import { getFieldDataForClass, GrpcMessageDef } from '../../decorators/message.decorator';
import * as _ from 'lodash';
import { upperFirst } from 'lodash';

export type IListValue<T> = {
  values: T[];
};

export function ListValue<T>(Cls: Type<T> | string): Type<IListValue<T>> {
  const name = upperFirst((Cls as any).name || Cls);
  @GrpcMessageDef({ name: `${name}ListValue` })
  class InArray {
    @GrpcFieldDef(() => [Cls] as any)
    values: T[];
  }

  return InArray as any;
}

const StringListValue = ListValue(String);

@GrpcMessageDef({ oneOf: true })
export class StringFieldComparison {
  @GrpcFieldDef(() => StringListValue)
  in: IListValue<string>;

  @GrpcFieldDef()
  eq: string;

  @GrpcFieldDef()
  like: string;

  @GrpcFieldDef()
  iLike: string;
}

@GrpcMessageDef({ oneOf: true })
export class BooleanFieldComparison {
  @GrpcFieldDef()
  eq: boolean;
}

@GrpcMessageDef({ oneOf: true })
export class DateFieldComparison {
  @GrpcFieldDef()
  eq: Date;
}

export function getEnumComparisonType<E>(Enum: E, enumName: string): any {
  const msgName = `${_.upperFirst(enumName)}FieldComparison`;
  const EnumInArr = ListValue(enumName);
  @GrpcMessageDef({ name: msgName, oneOf: true })
  class EnumComparison {
    @GrpcFieldDef(() => EnumInArr)
    in: E[];

    @GrpcFieldDef(() => enumName)
    eq: E;
  }

  return EnumComparison;
}

export function getDefaultFilter<M>(ModelCls: Type<M>): Type<Filter<M>> {
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
}
