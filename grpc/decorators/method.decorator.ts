import { Type } from '@nestjs/common';
import { GMessageInput } from '../grpc.interface';
import { messageReflector, methodReflector } from './decorators';

type MethodOptions = {
  name?: string;
  requestType: () => Type;
  responseType: () => Type;
};

export function GrpcMethodDef({ name, requestType, responseType }: MethodOptions): MethodDecorator {
  return (target, propertyKey: string, descriptor) => {
    const newMeth = {
      name: name || propertyKey,
      requestType,
      responseType,
      propertyKey,
      descriptor,
    };
    methodReflector.append(target.constructor as any, newMeth);
  };
}
