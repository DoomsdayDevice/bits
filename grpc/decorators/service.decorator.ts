import { GMethodInput } from '../common/types';
import { GrpcMethod } from '@nestjs/microservices';
import { grpcMethods, grpcServices, methodReflector } from '../common/variables';
import { Type } from '@nestjs/common';
import { getPrototypeChain } from '@bits/grpc/common/reflectors';

export function GrpcServiceDef(name?: string, stack: boolean = false): ClassDecorator {
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
    const exists = grpcServices.find(s => s.name === serviceName);
    if (!exists) grpcServices.push({ name: serviceName });
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
