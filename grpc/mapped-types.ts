import { fieldReflector } from './common/variables';
import { Type } from '@nestjs/common';
import { getFieldDataForClass } from '@bits/grpc/decorators/message.decorator';

export function PartialType<T extends Type>(MsgClass: T): Type<Partial<InstanceType<T>>> {
  // take all field metadatas for class
  const fieldMeta = getFieldDataForClass(MsgClass);
  // create new class
  // put altered meta to id
  class PartialCls {}
  for (const fm of fieldMeta) {
    fieldReflector.append(PartialCls, {
      ...fm,
      nullable: true,
    });
  }
  return PartialCls;
}

export function OmitType<T extends Type, K extends readonly (keyof InstanceType<T>)[]>(
  MsgClass: T,
  keys: K,
): Type<Omit<InstanceType<T>, K[number]>> {
  // take all field metadatas for class
  const fieldMeta = getFieldDataForClass(MsgClass);
  // create new class
  // put altered meta to id
  class PartialCls {}
  for (const fm of fieldMeta.filter(fm => !keys.includes(fm.name))) {
    fieldReflector.append(PartialCls, { ...fm });
  }
  return PartialCls as any;
}

export function PickType<T extends Type, K extends readonly (keyof InstanceType<T>)[]>(
  MsgClass: T,
  keys: K,
): Type<Pick<InstanceType<T>, K[number]>> {
  const fieldMeta = getFieldDataForClass(MsgClass);

  class PartialCls {}
  for (const fm of fieldMeta.filter(fm => keys.includes(fm.name))) {
    fieldReflector.append(PartialCls, { ...fm });
  }
  return PartialCls as any;
}
