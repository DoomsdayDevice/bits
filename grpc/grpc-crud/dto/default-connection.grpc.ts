import { Type } from '@nestjs/common';
import { memoize } from 'lodash';
import { GrpcFieldDef, GrpcMessageDef, UInt32 } from '@bits/grpc';
import { IConnection } from '@bits/bits.types';

export const getOrCreateConnection = memoize(<M>(ModelCls: Type<M>): Type<IConnection<M>> => {
  @GrpcMessageDef({ name: `${ModelCls.name}Connection` })
  class GenericFindManyResponse {
    @GrpcFieldDef(() => UInt32)
    totalCount: number;

    @GrpcFieldDef(() => [ModelCls])
    nodes: M[];
  }

  return GenericFindManyResponse;
});
