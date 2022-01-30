import { fieldReflector } from './decorators';
import { GFieldInput } from '@bits/grpc/grpc.interface';
import { Type } from '@nestjs/common';

export function GrpcFieldDef({
  name,
  typeFn,
}: {
  name?: string;
  typeFn: () => Type | [Type] | string | [string];
}): PropertyDecorator {
  // get decorators on prototype and add them to fields

  return (target: any, propertyKey: string) => {
    const isArr = Array.isArray(typeFn());
    const field: GFieldInput = {
      name: name || propertyKey,
      typeFn: isArr ? () => typeFn()[0] : typeFn,
      messageName: '',
    };
    if (isArr) field.rule = 'repeated';
    fieldReflector.append(target.constructor, field);
  };
}
