import { grpcEnums } from "../constants/variables";

export function GrpcEnumDef(keys: string[]): PropertyDecorator {
  return (target: any, propertyKey: string | symbol) => {};
}

export function registerEnum(e: Record<string, number | string>, name: string) {
  grpcEnums.push({ enum: e, name });
}
