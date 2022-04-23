import { GFieldInput, GMessageInput } from '@bits/grpc/grpc.interface';
import { Type } from '@nestjs/common';
import { fieldReflector, messageReflector } from './decorators';
import { Float, Int64, UInt32 } from '@bits/grpc/grpc.scalars';

export type GrpcFieldOpts = {
  name?: string;
  nullable?: boolean;
  filterable?: boolean;
};

type TypeFn = () => Type | [Type] | string | [string];

export function GrpcFieldDef(): PropertyDecorator;
export function GrpcFieldDef(typeFn: TypeFn): PropertyDecorator;
export function GrpcFieldDef(opts: GrpcFieldOpts): PropertyDecorator;
export function GrpcFieldDef(typeFn: TypeFn, opts: GrpcFieldOpts): PropertyDecorator;
export function GrpcFieldDef(
  typeFnOrOpts?: TypeFn | GrpcFieldOpts,
  opts?: GrpcFieldOpts,
): PropertyDecorator {
  // get decorators on prototype and add them to fields

  return (target: any, propertyKey: string) => {
    if (typeFnOrOpts instanceof Function) {
    } else {
      const t = Reflect.getMetadata('design:type', target, propertyKey);
      opts = typeFnOrOpts as GrpcFieldOpts;
      typeFnOrOpts = () => t;
    }
    const isArr = Array.isArray(typeFnOrOpts());
    const field: GFieldInput = {
      name: opts?.name || propertyKey,
      typeFn: isArr ? () => (typeFnOrOpts as TypeFn)()[0] : typeFnOrOpts,
      messageName: '',
      nullable: opts?.nullable,
      filterable: opts?.filterable,
    };
    if (isArr) field.rule = 'repeated';
    fieldReflector.append(target.constructor, field);
  };
}

/** wrapped for nullables and such */
export function getFieldType(type: any, wrapped = false): string {
  if (type === String || type === Date) {
    // return nullable ? 'google.protobuf.StringValue' : 'string';
    return 'string';
  } else if (type === 'uint32' || type === UInt32) {
    // return nullable ? 'google.protobuf.UInt32Value' : 'uint32';
    return 'uint32';
  } else if (type === 'int32') {
    // return nullable ? 'google.protobuf.Int32Value' : 'int32';
    return 'int32';
  } else if (type === 'int64' || type === Int64) {
    // return nullable ? 'google.protobuf.Int32Value' : 'int32';
    return 'int64';
  } else if (type === 'bytes') {
    return 'bytes';
    // return nullable ? 'google.protobuf.BytesValue' : 'bytes';
  } else if (type === 'float' || type === Float) {
    // return nullable ? 'google.protobuf.FloatValue' : 'float';
    return 'float';
  } else if (type === 'bool' || type === Boolean) {
    if (wrapped) return 'BoolValue';
    return 'bool';
    // return nullable ? 'BoolValue' : 'bool';
  } else if (typeof type === 'string') return type;
  else {
    const name = messageReflector.get<unknown, GMessageInput>(type)?.name;
    if (!name) throw new Error("GRPC: Couldn't find the correct type for field");
    return name;
  }
}
