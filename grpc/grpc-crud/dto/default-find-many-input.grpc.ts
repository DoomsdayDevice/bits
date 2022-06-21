import { Type } from '@nestjs/common';
import { IGrpcFindManyInput, IListValue } from '../grpc-controller.interface';
import { GrpcMessageDef } from '../../decorators/message.decorator';
import { GrpcFieldDef } from '../../decorators/field.decorator';
import { OffsetPagination, Sort } from '../../grpc.dto';
import { getOrCreateDefaultFilter } from './default-filter.grpc';
import { IGrpcFilter } from '@bits/grpc/grpc-filter.interface';
import { memoize } from 'lodash';
import { getListValueOfCls } from '@bits/grpc/decorators/list-value';

export const getOrCreateFindManyInput = memoize(
  <M>(ModelCls: Type<M>): Type<IGrpcFindManyInput<M>> => {
    const F = getOrCreateDefaultFilter(ModelCls);
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
