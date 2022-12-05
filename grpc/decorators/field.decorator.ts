import { Type } from '@nestjs/common';
import type { GFieldInput } from '..';
import { GrpcFieldOpts, getListValueOfCls } from '.';
import { fieldReflector } from '..';

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
      typeFn: isArr ? () => typeArrayFn()[0] : typeFn,
      messageName: '',
      nullable: opts?.nullable,
      filterable: opts?.filterable,
    };
    if (isArr) {
      if (field.nullable) {
        field.listValue = getListValueOfCls(field.typeFn());
      } else field.rule = 'repeated';
    }
    fieldReflector.append(target.constructor, field);
  };
}
