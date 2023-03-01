import { Type } from "@nestjs/common";
import { memoize } from "lodash";
import { GrpcFieldDef, GrpcMessageDef } from "../decorators";
import { IConnection } from "@bits/core";
import { UInt32 } from "../common";

export const getOrCreateConnection = memoize(
  <M>(ModelCls: Type<M>): Type<IConnection<M>> => {
    @GrpcMessageDef({ name: `${ModelCls.name}Connection` })
    class GenericFindManyResponse {
      @GrpcFieldDef(() => UInt32)
      totalCount!: number;

      @GrpcFieldDef(() => [ModelCls])
      nodes!: M[];
    }

    return GenericFindManyResponse;
  }
);
