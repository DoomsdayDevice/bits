import { GMessageInput, GMethodInput } from '../grpc.interface';
import { messageReflector, methodReflector } from './decorators';
import { Type } from '@nestjs/common';

type MethodOptions = {
  name?: string;
  requestType: () => Type;
  responseType: () => Type;
};

export function GrpcMethodDef({ name, requestType, responseType }: MethodOptions): MethodDecorator {
  return (target, propertyKey: string, descriptor) => {
    const newMeth = {
      name: name || propertyKey,
      requestType: () => messageReflector.get<unknown, GMessageInput>(requestType()).name,
      responseType: () => messageReflector.get<unknown, GMessageInput>(responseType()).name,
      propertyKey,
      descriptor,
    };
    methodReflector.append(target.constructor as any, newMeth);
  };
}
