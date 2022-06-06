import { fieldReflector, grpcFields, grpcMessages, messageReflector } from './decorators';
import { getPrototypeChain } from '@bits/grpc/reflector';
import { GFieldInput } from '@bits/grpc/grpc.interface';
import { Type } from '@nestjs/common';

type GrpcMessageOpts = {
  name?: string;
  isAbstract?: boolean;
  oneOf?: boolean;
};

export function GrpcMessageDef(opts?: GrpcMessageOpts): ClassDecorator {
  // get all field defs
  return target => {
    const messageName = opts?.name || target.name;

    messageReflector.set(target as any, {
      name: messageName,
      oneOf: opts?.oneOf,
    });

    for (const field of getFieldDataForClass(target as any)) {
      grpcFields.push({ ...(field as any), messageName });
    }
    if (!opts?.isAbstract) grpcMessages.push({ name: messageName, oneOf: opts?.oneOf });
  };
}

export function getFieldDataForClass(Cls: Type) {
  const fieldsForMsg: GFieldInput[] = [];
  const chain = getPrototypeChain(Cls as any);
  chain.forEach(cls => {
    const foundFields = fieldReflector.get<unknown, GFieldInput>(cls as any);
    if (foundFields)
      fieldsForMsg.unshift(
        ...foundFields.filter(ff => !fieldsForMsg.map(f => f.name).includes(ff.name)),
      );
  });
  return fieldsForMsg;
}
