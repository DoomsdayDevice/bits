import { Class } from "@bits/core";
import { InputType, OmitType } from "@nestjs/graphql";

export function getDefaultCreateOneInput<T>(
  ModelCls: Class<T>,
  modelName?: string
): Class<Omit<T, "createdAt" | "id" | "updatedAt">> {
  return OmitType(ModelCls, ["createdAt", "id", "updatedAt"] as any, () =>
    InputType(`CreateOne${modelName || ModelCls.name}Input`)
  ) as any;
}
