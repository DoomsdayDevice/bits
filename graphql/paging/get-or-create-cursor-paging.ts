import { Type } from '@nestjs/common';
import { Field, InputType, Int } from '@nestjs/graphql';
import { IsPositive, Min, Validate } from 'class-validator';
import { ConnectionCursorType, ICursorPagination } from './pagination.interface';
import { PagingStrategy } from '../../common/paging-strategy.enum';
import { IsUndefined } from '../validators/is-undefined.validator';
import { CannotUseWithout } from '../validators/cannot-use-without.validator';
import { ConnectionCursorScalar } from './connection-cursor.scalar';
import { CannotUseWith } from '../validators/cannot-use-with.validator';

/** @internal */
let graphQLCursorPaging: Type<ICursorPagination> | null = null;
// eslint-disable-next-line @typescript-eslint/no-redeclare -- intentional

export const getOrCreateCursorPagingType = (): Type<ICursorPagination> => {
  @InputType('CursorPaging')
  class GraphQLCursorPagingImpl implements ICursorPagination {
    static strategy: PagingStrategy.CURSOR = PagingStrategy.CURSOR;

    @Field(() => ConnectionCursorScalar, {
      nullable: true,
      description: 'Paginate before opaque cursor',
    })
    @IsUndefined()
    @Validate(CannotUseWithout, ['last'])
    @Validate(CannotUseWith, ['after', 'first'])
    before?: ConnectionCursorType;

    @Field(() => ConnectionCursorScalar, {
      nullable: true,
      description: 'Paginate after opaque cursor',
    })
    @IsUndefined()
    @Validate(CannotUseWithout, ['first'])
    @Validate(CannotUseWith, ['before', 'last'])
    after?: ConnectionCursorType;

    @Field(() => Int, { nullable: true, description: 'Paginate first' })
    @IsUndefined()
    @IsPositive()
    @Min(1)
    @Validate(CannotUseWith, ['before', 'last'])
    first?: number;

    @Field(() => Int, { nullable: true, description: 'Paginate last' })
    @IsUndefined()
    // Required `before`. This is a weird corner case.
    // We'd have to invert the ordering of query to get the last few items then re-invert it when emitting the results.
    // We'll just ignore it for now.
    @Validate(CannotUseWithout, ['before'])
    @Validate(CannotUseWith, ['after', 'first'])
    @Min(1)
    @IsPositive()
    last?: number;
  }
  graphQLCursorPaging = GraphQLCursorPagingImpl;
  return graphQLCursorPaging;
};
