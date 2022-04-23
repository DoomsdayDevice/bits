import { Type } from '@nestjs/common';
import { Filter, FindManyInput } from '../grpc-controller.interface';
import { GrpcMessageDef } from '../../decorators/message.decorator';
import { GrpcFieldDef } from '../../decorators/field.decorator';
import { OffsetPagination } from '../../grpc.dto';
import { getDefaultFilter } from './default-filter.grpc';

export function getDefaultFindManyInput<M>(ModelCls: Type<M>): Type<FindManyInput<M>> {
  const F = getDefaultFilter(ModelCls);
  @GrpcMessageDef({ name: `FindMany${ModelCls.name}Input` })
  class GenericFindManyInput {
    @GrpcFieldDef(() => OffsetPagination)
    paging: OffsetPagination;

    @GrpcFieldDef(() => F)
    filter: Filter<M>;
  }
  return GenericFindManyInput;
}
