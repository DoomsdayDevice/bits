import { Type } from '@nestjs/common';
import { GMessageInput, GMethodInput } from '../grpc.interface';
import { messageReflector, methodReflector } from './decorators';

type MethodOptions = {
  name?: string;
  requestType: () => Type | string;
  responseType: () => Type | string;
};

export function GrpcMethodDef({ name, requestType, responseType }: MethodOptions): MethodDecorator {
  return (target, propertyKey: string | symbol, descriptor) => {
    if (typeof propertyKey === 'symbol') throw new Error('symbols not allowed');

    const newMeth: GMethodInput = {
      name: name || propertyKey,
      requestType,
      responseType,
      propertyKey,
      descriptor,
      service: '',
    };
    methodReflector.append(target.constructor as any, newMeth);
  };
}
