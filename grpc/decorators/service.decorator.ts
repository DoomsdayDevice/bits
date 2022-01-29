import { GMethodInput } from '../grpc.interface';
import { GrpcMethod } from '@nestjs/microservices';
import { grpcMethods, grpcServices, methodReflector } from './decorators';

export function GrpcServiceDef(name?: string): ClassDecorator {
  return target => {
    const serviceName = name || target.name;

    const gotten = methodReflector.get<unknown, GMethodInput>(target as any, true);

    if (gotten) {
      for (const meth of Array.from(gotten)) {
        GrpcMethod(serviceName, meth.name)(target, meth.propertyKey, meth.descriptor);

        grpcMethods.push({ ...(meth as any), service: serviceName });
      }
    }
    grpcServices.push({ name: serviceName });
  };
}
