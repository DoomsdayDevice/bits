import { GFieldInput, GMessageInput } from '@bits/grpc/grpc.interface';
import { Type } from '@nestjs/common';
import { Float, Int64, UInt32 } from '@bits/grpc/grpc.scalars';
import { fieldReflector, messageReflector } from './decorators';

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

  return (target: any, propertyKey: string | symbol) => {
    if (typeof propertyKey === 'symbol') throw new Error('symbols not allowed');
    if (!(typeFnOrOpts instanceof Function)) {
      const t = Reflect.getMetadata('design:type', target, propertyKey);
      opts = typeFnOrOpts as GrpcFieldOpts;
      typeFnOrOpts = () => t;
    }

    const typeArrayFn = typeFnOrOpts as () => [Type] | [string];
    const typeFn = typeFnOrOpts as () => Type | string;

    const isArr = Array.isArray(typeFnOrOpts());
    const field: GFieldInput = {
      name: opts?.name || propertyKey,
      typeFn: isArr ? typeArrayFn : typeFn,
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
  switch (type) {
    case String:
    case Date:
      return 'string';
    case 'uint32':
    case UInt32:
      return 'uint32';
    case 'int32':
      return 'int32';
    case 'int64':
    case Int64:
      return 'int64';
    case 'bytes':
      return 'bytes';
    case 'float':
    case Float:
      return 'float';
    case 'bool':
    case Boolean:
      if (wrapped) return 'BoolValue';
      return 'bool';
    case 'string':
      return type;
    default: {
      const name = messageReflector.get<unknown, GMessageInput>(type)?.name;
      if (!name) throw new Error("GRPC: Couldn't find the correct type for field");
      return name;
    }
  }
}
