import { GMethodInput } from "@bits/core";
import { Type, UsePipes, ValidationPipe } from "@nestjs/common";
import { methodReflector } from "../constants";

type MethodOptions = {
  name?: string;
  requestType: () => Type | string;
  responseType: () => Type | string;
};

export function GrpcMethodDef({
  name,
  requestType,
  responseType,
}: MethodOptions): MethodDecorator {
  return (target, propertyKey: string | symbol, descriptor) => {
    if (typeof propertyKey === "symbol") throw new Error("symbols not allowed");
    UsePipes(new ValidationPipe({ transform: true }))(
      target,
      propertyKey,
      descriptor
    );

    const newMeth: GMethodInput = {
      name: name || propertyKey,
      requestType,
      responseType,
      propertyKey,
      descriptor,
      service: "",
    };
    methodReflector.append(target.constructor as any, newMeth);
  };
}
