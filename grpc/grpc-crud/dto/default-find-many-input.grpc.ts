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

type Cfg = {
  isSimple?: boolean;
  paging?: boolean;
  filter?: boolean;
  sorting?: boolean;
};

export const getOrCreateFindManyInput = memoize(
  <M>(
    ModelCls: Type<M>,
    { isSimple = false, paging = true, filter = true, sorting = true }: Cfg = {},
  ): Type<IGrpcFindManyInput<M>> => {
    if (isSimple) {
      @GrpcMessageDef({ name: `FindMany${ModelCls.name}Input` })
      class GenericFindManyInput {}
      return GenericFindManyInput;
    }
    @GrpcMessageDef({ name: `FindMany${ModelCls.name}Input` })
    class GenericFindManyInput {
      paging?: OffsetPagination;

      filter?: IGrpcFilter<M>;

      sorting?: IListValue<Sort>;
    }

    if (paging)
      GrpcFieldDef(() => OffsetPagination, { nullable: true })(
        GenericFindManyInput.prototype,
        'paging',
      );
    if (filter) {
      const F = getOrCreateDefaultFilter(ModelCls);
      GrpcFieldDef(() => F, { nullable: true })(GenericFindManyInput.prototype, 'filter');
    }
    if (sorting)
      GrpcFieldDef(() => getListValueOfCls(Sort), { nullable: true })(
        GenericFindManyInput.prototype,
        'sorting',
      );
    return GenericFindManyInput;
  },
);
