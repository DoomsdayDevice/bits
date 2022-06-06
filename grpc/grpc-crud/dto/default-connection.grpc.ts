import { Type } from '@nestjs/common';
import { IConnection } from '../../../bits.types';
import { GrpcMessageDef } from '../../decorators/message.decorator';
import { GrpcFieldDef } from '../../decorators/field.decorator';
import { UInt32 } from '../../grpc.scalars';
import { memoize } from 'lodash';

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
