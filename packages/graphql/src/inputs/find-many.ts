import { ArgsType, Field } from "@nestjs/graphql";
import { OffsetPagination } from "./offset-paging";
import { Class, PagingStrategy } from "@bits/core";
import { IFindManyArgs, IPaging } from "../types/crud";
import { getOrCreateCursorPagingType } from "./get-or-create-cursor-paging";
import { getDefaultFilter } from "./filter";
import { IGqlFilter } from "../types";
import { memoize } from "lodash";

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
    }

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
