import { Type } from '@nestjs/common';
import { IGrpcFindManyInput } from '../grpc-controller.interface';
import { GrpcMessageDef } from '../../decorators/message.decorator';
import { GrpcFieldDef } from '../../decorators/field.decorator';
import { OffsetPagination } from '../../grpc.dto';
import { getOrCreateDefaultFilter } from './default-filter.grpc';
import { IGrpcFilter } from '@bits/grpc/grpc-filter.interface';
import { memoize } from 'lodash';

export const getOrCreateFindManyInput = memoize(
  <M>(ModelCls: Type<M>): Type<IGrpcFindManyInput<M>> => {
    const F = getOrCreateDefaultFilter(ModelCls);
    @GrpcMessageDef({ name: `FindMany${ModelCls.name}Input` })
    class GenericFindManyInput {
      @GrpcFieldDef(() => OffsetPagination, { nullable: true })
      paging?: OffsetPagination;

      @GrpcFieldDef(() => F, { nullable: true })
      filter?: IGrpcFilter<M>;
    }
    return GenericFindManyInput;
  },
);
