import { fieldReflector, messageReflector } from './decorators';
import { GFieldInput, GMessageInput } from '@bits/grpc/grpc.interface';
import { Type } from '@nestjs/common';

export type GrpcFieldOpts = {
  name?: string;
  nullable?: boolean;
};
export function GrpcFieldDef(
  typeFn: () => Type | [Type] | string | [string],
  opts?: GrpcFieldOpts,
): PropertyDecorator {
  // get decorators on prototype and add them to fields

  return (target: any, propertyKey: string) => {
    const isArr = Array.isArray(typeFn());
    const field: GFieldInput = {
      name: opts?.name || propertyKey,
      typeFn: isArr ? () => typeFn()[0] : typeFn,
      messageName: '',
      nullable: opts?.nullable,
    };
    if (isArr) field.rule = 'repeated';
    fieldReflector.append(target.constructor, field);
  };
}

export function getFieldType(type: any, nullable: boolean): string {
  if (type === String) {
    return nullable ? 'StringValue' : 'string';
  } else if (type === 'uint32') {
    return nullable ? 'UInt32Value' : 'uint32';
  } else if (type === 'int32') {
    return nullable ? 'Int32Value' : 'int32';
  } else if (type === 'bytes') {
    return nullable ? 'BytesValue' : 'bytes';
  } else if (type === 'float') {
    return nullable ? 'FloatValue' : 'float';
  } else if (type === 'bool' || type === Boolean) {
    return nullable ? 'BoolValue' : 'bool';
  } else if (typeof type === 'string') return type;
  else {
    return messageReflector.get<unknown, GMessageInput>(type)?.name;
  }
}
