import {
  ArgsType,
  Field,
  InputType,
  Int,
  ObjectType,
  OmitType,
  PartialType,
} from '@nestjs/graphql';
import { GraphQLUUID } from 'graphql-scalars';
import { Type } from '@nestjs/common';
import { IFindManyArgs, IPaging, IUpdateOneInput } from '@bits/graphql/gql-crud/gql-crud.interface';
import { IGqlFilter } from '@bits/graphql/filter/filter.interface';
import {
  createFilterComparisonType,
  getFilterableFields,
} from '@bits/graphql/filter/filter-comparison.factory';
import * as _ from 'lodash';
import { memoize } from 'lodash';
import { ValidateNested } from 'class-validator';
import { Type as TransformerType } from 'class-transformer';
import { IConnection } from '@bits/bits.types';
import { PagingStrategy } from '@bits/common/paging-strategy.enum';
import { getOrCreateCursorPagingType } from '@bits/graphql/paging/get-or-create-cursor-paging';
import { OffsetPagination } from '@bits/graphql/paging/offset-paging';

@InputType({ isAbstract: true })
export class DeleteByIDInput {
  @Field(() => GraphQLUUID)
  id!: string;
}
@InputType()
export class FindOneInput {
  @Field(() => GraphQLUUID)
  id!: string;
}

export function getDefaultUpdateOneInput<T>(
  ModelCls: Type<T>,
  modelName?: string,
): Type<IUpdateOneInput<T>> {
  const DefaultUpdate = PartialType(ModelCls, () =>
    InputType(`${modelName || ModelCls.name}Update`),
  );

  @InputType(`UpdateOne${modelName || ModelCls.name}Input`)
  class UpdateOneInput {
    @Field(() => GraphQLUUID)
    id!: string;

    @Field(() => DefaultUpdate)
    update!: Partial<T>;
  }

  return UpdateOneInput;
}

export function getDefaultCreateOneInput<T>(
  ModelCls: Type<T>,
  modelName?: string,
): Type<Omit<T, 'createdAt' | 'id' | 'updatedAt'>> {
  return OmitType(ModelCls, ['createdAt', 'id', 'updatedAt'] as any, () =>
    InputType(`CreateOne${modelName || ModelCls.name}Input`),
  ) as any;

  // @InputType(`CreateOne${modelName || ModelCls.name}Input`)
  // class CreateOneInput {
  //   @Field(() => DefaultUpdate)
  //   update!: Partial<T>;
  // }
  //
  // return CreateOneInput;
}

export const getDefaultModelConnection = memoize(
  <T>(Model: Type<T>, modelName?: string): Type<IConnection<T>> => {
    @ObjectType(`${modelName || Model.name}Connection`)
    class DtoConnectionCls {
      @Field(() => Int)
      totalCount = 0;

      @Field(() => [Model])
      nodes!: T[];
    }
    return DtoConnectionCls;
  },
);

// TODO add getOrCreate with memoize for nested filters
export function getDefaultFilter<T>(Model: Type<T>, modelName: string): Type<IGqlFilter<T>> {
  @InputType(`${modelName}Filter`)
  class GraphQLFilter {
    @Field(() => [GraphQLFilter], { nullable: true })
    AND!: GraphQLFilter[];

    @Field(() => [GraphQLFilter], { nullable: true })
    OR!: GraphQLFilter[];
  }
  const filterableFields = getFilterableFields(Model);
  filterableFields.forEach(({ propertyName, target, advancedOptions, returnTypeFunc }) => {
    const FC = createFilterComparisonType({
      FieldType: target,
      fieldName: `${modelName}${_.capitalize(propertyName)}`,
      allowedComparisons: advancedOptions?.allowedComparisons,
      returnTypeFunc,
    });
    const nullable = advancedOptions?.filterRequired !== true;
    ValidateNested()(GraphQLFilter.prototype, propertyName);
    Field(() => FC, { nullable })(GraphQLFilter.prototype, propertyName);
    TransformerType(() => FC)(GraphQLFilter.prototype, propertyName);
  });

  return GraphQLFilter as any;
}

export const getDefaultFindManyArgs = memoize(
  <T, P extends PagingStrategy>(
    Model: Type<T>,
    modelName: string,
    paginationStrategy: P,
  ): Type<IFindManyArgs<T, P>> => {
    const Filter = getDefaultFilter(Model, modelName);

    @ArgsType()
    class FindManyArgs {
      @Field(() => Filter, { nullable: true })
      filter?: IGqlFilter<T>;

      paging?: IPaging<P>;
    }

    if (paginationStrategy === PagingStrategy.CURSOR) {
      const PagingType = getOrCreateCursorPagingType();
      Field(() => PagingType, { nullable: true })(FindManyArgs.prototype, 'paging');
    } else if (paginationStrategy === PagingStrategy.OFFSET) {
      Field(() => OffsetPagination, { nullable: true })(FindManyArgs.prototype, 'paging');
    }

    return FindManyArgs;
  },
);
