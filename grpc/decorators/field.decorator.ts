import { fieldReflector } from './decorators';

export function GrpcFieldDef({ name, type }: { name?: string; type: string }): PropertyDecorator {
  // get decorators on prototype and add them to fields

  return (target: any, propertyKey) => {
    const field = { name: name || propertyKey, type };
    console.log({ field });
    fieldReflector.append(target.constructor, field);
  };
}
