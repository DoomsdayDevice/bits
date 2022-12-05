import { Type } from '@nestjs/common';
import { IGrpcFilter } from '@bits/grpc/grpc-filter.interface';
import { memoize } from 'lodash';
import {
  getListValueOfCls,
  getOrCreateDefaultFilter,
  GrpcFieldDef,
  GrpcMessageDef,
  IGrpcFindManyInput,
  IListValue,
  OffsetPagination,
  Sort,
} from '@bits/grpc';

export const getOrCreateFindManyInput = memoize(
  <M>(ModelCls: Type<M>, isSimple = false): Type<IGrpcFindManyInput<M>> => {
    const F = getOrCreateDefaultFilter(ModelCls);
    if (isSimple) {
      @GrpcMessageDef({ name: `FindMany${ModelCls.name}Input` })
      class GenericFindManyInput {}
      return GenericFindManyInput;
    }
    @GrpcMessageDef({ name: `FindMany${ModelCls.name}Input` })
    class GenericFindManyInput {
      @GrpcFieldDef(() => OffsetPagination, { nullable: true })
      paging?: OffsetPagination;

      @GrpcFieldDef(() => F, { nullable: true })
      filter?: IGrpcFilter<M>;

      @GrpcFieldDef(() => getListValueOfCls(Sort), { nullable: true })
      sorting?: IListValue<Sort>;
    }
    return GenericFindManyInput;
  },
);
