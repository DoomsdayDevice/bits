import { Type } from "@nestjs/common";
import { memoize } from "lodash";
import { IGrpcFilter, IGrpcFindManyInput, IListValue, Sort } from "@bits/core";
import { getOrCreateDefaultFilter } from "./default-filter.grpc";
import { getListValueOfCls, GrpcFieldDef, GrpcMessageDef } from "../decorators";
import { OffsetPagination } from "@bits/graphql";

type Cfg = {
  paging?: boolean;
  filter?: boolean;
  sorting?: boolean;
};

export const getOrCreateFindManyInput = memoize(
  <M, Enums>(
    ModelCls: Type<M>,
    { paging = true, filter = true, sorting = true }: Cfg = {}
  ): Type<IGrpcFindManyInput<M, Enums>> => {
    class GenericFindManyInput {
      paging?: OffsetPagination;

      filter?: IGrpcFilter<M, Enums>;

      sorting?: IListValue<Sort>;
    }

    if (paging)
      GrpcFieldDef(() => OffsetPagination, { nullable: true })(
        GenericFindManyInput.prototype,
        "paging"
      );
    if (filter) {
      const F = getOrCreateDefaultFilter(ModelCls);
      GrpcFieldDef(() => F, { nullable: true })(
        GenericFindManyInput.prototype,
        "filter"
      );
    }
    if (sorting)
      GrpcFieldDef(() => getListValueOfCls(Sort), { nullable: true })(
        GenericFindManyInput.prototype,
        "sorting"
      );
    GrpcMessageDef({ name: `FindMany${ModelCls.name}Input` })(
      GenericFindManyInput
    );
    return GenericFindManyInput;
  }
);
