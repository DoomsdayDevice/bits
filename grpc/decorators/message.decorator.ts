import { fieldReflector, grpcFields, grpcMessages, messageReflector } from './decorators';
import { BaseEntity } from '@core/db/base.entity';
import { getPrototypeChain } from '@bits/grpc/reflector';

export function GrpcMessageDef(name?: string): ClassDecorator {
  // get all field defs
  return target => {
    const messageName = name || target.name;

    const fieldsForMsg = [];
    const chain = getPrototypeChain(target as any);
    chain.forEach(cls => {
      const foundFields = fieldReflector.get(cls as any, true);
      if (foundFields) fieldsForMsg.push(...foundFields);
    });
    messageReflector.set(target as any, { name: messageName });

    if (fieldsForMsg) {
      console.log({ messageName, fieldsForMsg });
      for (const field of Array.from(fieldsForMsg)) {
        grpcFields.push({ ...(field as any), messageName });
      }
    }
    grpcMessages.push({ name: messageName });
  };
}
