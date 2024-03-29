import { fieldReflector } from "../constants/variables";
import { Type } from "@nestjs/common";
import {
  applyIsOptionalDecorator,
  inheritTransformationMetadata,
  inheritValidationMetadata,
} from "../grpc.utils";
import { getFieldDataForClass } from "../decorators";

export function PartialType<T extends Type>(
  MsgClass: T
): Type<Partial<InstanceType<T>>> {
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

  const propertyKeys = inheritValidationMetadata(MsgClass, PartialCls);
  inheritTransformationMetadata(MsgClass, PartialCls);

  if (propertyKeys) {
    propertyKeys.forEach((key) => {
      applyIsOptionalDecorator(PartialCls, key);
    });
  }
  return PartialCls;
}

export function OmitType<
  T extends Type,
  K extends readonly (keyof InstanceType<T>)[]
>(
  MsgClass: T,
  keys: K,
  decorator?: any
): Type<Omit<InstanceType<T>, K[number]>> {
  // take all field metadatas for class
  const fieldMeta = getFieldDataForClass(MsgClass);
  // create new class
  // put altered meta to id
  class PartialCls {}
  for (const fm of fieldMeta.filter((fm) => !keys.includes(fm.name))) {
    fieldReflector.append(PartialCls, { ...fm });
  }

  if (decorator) decorator(PartialCls);
  return PartialCls as any;
}

export function PickType<
  T extends Type,
  K extends readonly (keyof InstanceType<T>)[]
>(MsgClass: T, keys: K): Type<Pick<InstanceType<T>, K[number]>> {
  const fieldMeta = getFieldDataForClass(MsgClass);

  class PartialCls {}
  for (const fm of fieldMeta.filter((fm) => keys.includes(fm.name))) {
    fieldReflector.append(PartialCls, { ...fm });
  }
  return PartialCls as any;
}
