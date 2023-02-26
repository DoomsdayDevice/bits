import { memoize } from "lodash";
import { Class, IConnection } from "@bits/core";
import { Field, Int, ObjectType } from "@nestjs/graphql";

export const getDefaultModelConnection = memoize(
  <T>(Model: Class<T>, modelName?: string): Class<IConnection<T>> => {
    @ObjectType(`${modelName || Model.name}Connection`)
    class DtoConnectionCls {
      @Field(() => Int)
      totalCount = 0;

      @Field(() => [Model])
      nodes!: T[];
    }
    return DtoConnectionCls;
  }
);
