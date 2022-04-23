import { Type } from '@nestjs/common';
import { Filter } from '../grpc-controller.interface';
import { fieldReflector, grpcEnums } from '../../decorators/decorators';
import { GFieldInput } from '../../grpc.interface';
import { GrpcFieldDef } from '../../decorators/field.decorator';
import { getFieldDataForClass, GrpcMessageDef } from '../../decorators/message.decorator';
import * as _ from 'lodash';
import { upperFirst } from 'lodash';

export type IInArray<T> = {
  list: T[];
};

export function InArray<T>(Cls: Type<T> | string): Type<IInArray<T>> {
  const name = upperFirst((Cls as any).name || Cls);
  @GrpcMessageDef({ name: `${name}InArray` })
  class InArray {
    @GrpcFieldDef(() => [Cls] as any)
    list: T[];
  }

  return InArray as any;
}

const StringInArray = InArray(String);

@GrpcMessageDef({ oneOf: true })
export class StringFieldComparison {
  @GrpcFieldDef(() => StringInArray)
  in: IInArray<string>;

  @GrpcFieldDef(() => String)
  eq: string;
}

export function getEnumComparisonType<E>(Enum: E, enumName: string): any {
  const msgName = `${_.upperFirst(enumName)}FieldComparison`;
  const EnumInArr = InArray(enumName);
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
      console.log('ITS A STRING', f.typeFn());
      filterTypeFn = () => StringFieldComparison;
    } else {
      const enumName = f.typeFn();
      const enumComp = getEnumComparisonType(
        grpcEnums.find(e => e.name === enumName),
        enumName,
      );
      filterTypeFn = () => enumComp;
      console.log({ type: f.typeFn() });
    }
    GrpcFieldDef(filterTypeFn, { name: f.name, filterable: f.filterable, nullable: true })(
      GenericFilter.prototype,
      f.name,
    );
  }

  GrpcMessageDef({ name: `${ModelCls.name}Filter` })(GenericFilter);
  return GenericFilter as any;
}
