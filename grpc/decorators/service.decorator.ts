import { GFieldInput, GMethodInput } from '../grpc.interface';
import { GrpcMethod } from '@nestjs/microservices';
import { fieldReflector, grpcMethods, grpcServices, methodReflector } from './decorators';
import { Type } from '@nestjs/common';
import { getPrototypeChain } from '@bits/grpc/reflector';

export function GrpcServiceDef(name?: string): ClassDecorator {
  return target => {
    const serviceName = name || target.name;

    // const gotten = methodReflector.get<unknown, GMethodInput>(target as any, true);
    const gotten = getMethodsForClass(target as any);

    if (gotten) {
      for (const meth of Array.from(gotten)) {
        GrpcMethod(serviceName, meth.name)(target, meth.propertyKey, meth.descriptor);

        grpcMethods.push({ ...(meth as any), service: serviceName });
      }
    }
    grpcServices.push({ name: serviceName });
  };
}

export function getMethodsForClass(Cls: Type) {
  const methsForService: GMethodInput[] = [];
  const chain = getPrototypeChain(Cls as any);
  chain.forEach(cls => {
    const foundFields = methodReflector.get<unknown, GMethodInput>(cls as any);
    if (foundFields)
      methsForService.unshift(
        ...foundFields.filter(ff => !methsForService.map(f => f.name).includes(ff.name)),
      );
  });
  return methsForService;
}
