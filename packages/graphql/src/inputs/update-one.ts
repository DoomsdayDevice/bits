import { Class, DeepPartial, IUpdateOneInput } from "@bits/core";
import { Field, InputType, PartialType } from "@nestjs/graphql";
import { GraphQLUUID } from "graphql-scalars";

export function getUpdateOneInputInputMain<T>(
  Update: Class,
  modelName: string
): Class<IUpdateOneInput<T>> {
  @InputType(`UpdateOne${modelName}Input`)
  class UpdateOneInput {
    @Field(() => GraphQLUUID)
    id!: string;

    @Field(() => Update)
    update!: DeepPartial<T>;
  }

  return UpdateOneInput;
}

export function getDefaultUpdateOneInput<T>(
  ModelCls: Class<T>,
  modelName?: string
): Class<IUpdateOneInput<T>> {
  const DefaultUpdate = PartialType(ModelCls, () =>
    InputType(`${modelName || ModelCls.name}Update`)
  );

  @InputType(`UpdateOne${modelName || ModelCls.name}Input`)
  class UpdateOneInput {
    @Field(() => GraphQLUUID)
    id!: string;

    @Field(() => DefaultUpdate)
    update!: DeepPartial<T>;
  }

  return UpdateOneInput;
}
