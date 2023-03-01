import { Type } from "@nestjs/common";
import {
  fieldReflector,
  grpcFields,
  grpcMessages,
  messageReflector,
} from "../constants/variables";
import { getPrototypeChain } from "@bits/backend";
import { GFieldInput } from "@bits/core";

type GrpcMessageOpts = {
  name?: string;
  isAbstract?: boolean;
  oneOf?: boolean;
};

export function GrpcMessageDef(opts?: GrpcMessageOpts): ClassDecorator {
  // get all field defs
  return (target) => {
    const messageName = opts?.name || target.name;

    if (!opts?.isAbstract) {
      if (!target) console.error({ opts });
      for (const field of getFieldDataForClass(target as any)) {
        grpcFields.push({ ...(field as any), messageName });
      }

      grpcMessages.push({ name: messageName, oneOf: opts?.oneOf });

      messageReflector.set(target as any, {
        name: messageName,
        oneOf: opts?.oneOf,
      });
    }
  };
}

export function getFieldDataForClass(Cls: Type) {
  const fieldsForMsg: GFieldInput[] = [];
  const chain = getPrototypeChain(Cls as any);
  chain.forEach((cls) => {
    const foundFields = fieldReflector.get<unknown, GFieldInput>(cls as any);
    if (foundFields)
      fieldsForMsg.unshift(
        ...foundFields.filter(
          (ff) => !fieldsForMsg.map((f) => f.name).includes(ff.name)
        )
      );
  });
  return fieldsForMsg;
}
