import { GFieldInput, GMessageInput } from '@bits/grpc/grpc.interface';
import { Type } from '@nestjs/common';
import { fieldReflector, messageReflector } from './decorators';

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
      rule: opts?.nullable ? 'optional' : 'required',
    };
    if (isArr) field.rule = 'repeated';
    fieldReflector.append(target.constructor, field);
  };
}

export function getFieldType(type: any, nullable: boolean): string {
  if (type === String) {
    // return nullable ? 'google.protobuf.StringValue' : 'string';
    return 'string';
  } else if (type === 'uint32') {
    // return nullable ? 'google.protobuf.UInt32Value' : 'uint32';
    return 'uint32';
  } else if (type === 'int32') {
    // return nullable ? 'google.protobuf.Int32Value' : 'int32';
    return 'int32';
  } else if (type === 'bytes') {
    return 'bytes';
    // return nullable ? 'google.protobuf.BytesValue' : 'bytes';
  } else if (type === 'float') {
    // return nullable ? 'google.protobuf.FloatValue' : 'float';
    return 'float';
  } else if (type === 'bool' || type === Boolean) {
    return 'bool';
    // return nullable ? 'BoolValue' : 'bool';
  } else if (typeof type === 'string') return type;
  else {
    const name = messageReflector.get<unknown, GMessageInput>(type)?.name;
    if (!name) throw new Error('wrong detected type');
    return name;
  }
}
