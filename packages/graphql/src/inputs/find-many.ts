import { ArgsType, Field, registerEnumType } from "@nestjs/graphql";
import { OffsetPagination } from "./offset-paging";
import {
  Class,
  IFindManyArgs,
  IGqlFilter,
  IPaging,
  PagingStrategy,
  SortDirection,
} from "@bits/core";
import { getOrCreateCursorPagingType } from "./get-or-create-cursor-paging";
import { getDefaultFilter } from "./filter";
import { memoize } from "lodash";
import { Sort } from "./sort";

export const getDefaultFindManyArgs = memoize(
  <T, P extends PagingStrategy>(
    Model: Class<T>,
    modelName: string,
    paginationStrategy: P
  ): Class<IFindManyArgs<T, P>> => {
    const Filter = getDefaultFilter(Model, modelName);

    @ArgsType()
    class FindManyArgs {
      @Field(() => Filter, { nullable: true })
      filter?: IGqlFilter<T>;

      paging?: IPaging<P>;

      @Field(() => [Sort], { nullable: true })
      sorting?: Sort[];
    }

    registerEnumType(SortDirection, { name: "SortDirection" });

    if (paginationStrategy === PagingStrategy.CURSOR) {
      const PagingType = getOrCreateCursorPagingType();
      Field(() => PagingType, { nullable: true })(
        FindManyArgs.prototype,
        "paging"
      );
    } else if (paginationStrategy === PagingStrategy.OFFSET) {
      Field(() => OffsetPagination, { nullable: true })(
        FindManyArgs.prototype,
        "paging"
      );
    }

    return FindManyArgs;
  }
);
