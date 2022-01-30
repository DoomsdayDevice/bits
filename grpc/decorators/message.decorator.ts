import { fieldReflector, grpcFields, grpcMessages, messageReflector } from './decorators';
import { BaseEntity } from '@core/db/base.entity';
import { getPrototypeChain } from '@bits/grpc/reflector';
import { GMessageInput } from '@bits/grpc/grpc.interface';

export function GrpcMessageDef(name?: string): ClassDecorator {
  // get all field defs
  return target => {
    const messageName = name || target.name;

    const fieldsForMsg = [];
    const chain = getPrototypeChain(target as any);
    chain.forEach(cls => {
      const foundFields = fieldReflector.get(cls as any);
      if (foundFields) fieldsForMsg.push(...foundFields);
    });
    messageReflector.set(target as any, { name: messageName });

    if (fieldsForMsg) {
      for (const field of Array.from(fieldsForMsg)) {
        let newTypeFn;
        if (field.typeFn() === String) newTypeFn = () => 'string';
        else if (typeof field.typeFn() === 'string') newTypeFn = field.typeFn;
        else if (field.typeFn() === Boolean) newTypeFn = () => 'bool';
        else {
          newTypeFn = () => messageReflector.get<unknown, GMessageInput>(field.typeFn())?.name;
        }
        const res = newTypeFn();

        grpcFields.push({ ...(field as any), messageName, typeFn: newTypeFn });
      }
    }
    grpcMessages.push({ name: messageName });
  };
}
