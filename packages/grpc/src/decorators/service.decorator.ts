import { GrpcMethod } from "@nestjs/microservices";
import { grpcMethods, grpcServices, methodReflector } from "../constants";
import { Controller, Type } from "@nestjs/common";
import { GMethodInput } from "@bits/core";
import { getPrototypeChain } from "@bits/backend";

export function GrpcServiceDef(
  name?: string,
  stack: boolean = false
): ClassDecorator {
  return (target) => {
    const serviceName = name || target.name;

    // const gotten = methodReflector.get<unknown, GMethodInput>(target as any, true);
    const gotten = getMethodsForClass(target as any);

    if (gotten) {
      for (const meth of Array.from(gotten)) {
        GrpcMethod(serviceName, meth.name)(
          target,
          meth.propertyKey,
          meth.descriptor
        );

        grpcMethods.push({ ...(meth as any), service: serviceName });
      }
    }
    const exists = grpcServices.find((s) => s.name === serviceName);
    if (!exists) grpcServices.push({ name: serviceName });

    Controller()(target);
  };
}

export function getMethodsForClass(Cls: Type) {
  const methsForService: GMethodInput[] = [];
  const chain = getPrototypeChain(Cls as any);
  chain.forEach((cls) => {
    const foundFields = methodReflector.get<unknown, GMethodInput>(cls as any);
    if (foundFields)
      methsForService.unshift(
        ...foundFields.filter(
          (ff) => !methsForService.map((f) => f.name).includes(ff.name)
        )
      );
  });
  return methsForService;
}
