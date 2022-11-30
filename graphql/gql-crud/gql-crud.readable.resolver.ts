import { Inject, Type } from '@nestjs/common';
import { Args, Query, Resolver } from '@nestjs/graphql';
import { transformAndValidate } from '@bits/dto.utils';
import {
  applyCursorPagingToInput,
  convertGqlOrderByToTypeorm,
  convertGraphqlFilterToService,
  getPlural,
  getSingular,
  renameFunc,
  renameKeyNames,
} from '@bits/bits.utils';
import {
  FindOneInput,
  getDefaultFindManyArgs,
  getDefaultModelConnection,
} from '@bits/graphql/gql-crud/gql-crud.dto';
import { IConnection } from '@bits/bits.types';
import { MongoQuery } from '@casl/ability';
import { CurrentUser } from '@bits/auth/current-user.decorator';
import { merge } from 'lodash';
import { ICrudService } from '@bits/services/interface.service';
import { PagingStrategy } from '@bits/common/paging-strategy.enum';
import { Action } from '@bits/auth/action.enum';
import { ICursorPagination } from '@bits/graphql/paging/pagination.interface';
import {
  ICaslAbilityFactory,
  IReadResolverConfig,
} from '@bits/graphql/gql-crud/crud-config.interface';
import { IBaseServiceRead, IFindManyArgs } from './gql-crud.interface';

export function ReadResolverMixin<
  T extends ModelResource,
  N extends string,
  IUser,
  Resources extends readonly any[],
>({
  Model,
  Service,
  pagination,
  resources,
  modelName = Model.name as N,
  AbilityFactory,
  RequirePrivileges,
}: IReadResolverConfig<T, Resources, N>): Type<IBaseServiceRead<T, N>> {
  const plural = getPlural(modelName);
  const singular = getSingular(modelName);

  const DefaultConnection = getDefaultModelConnection(Model, modelName);

  const FindManyType = pagination ? DefaultConnection : [Model];
  const FindManyInput = getDefaultFindManyArgs(Model, modelName, pagination);

  @Resolver(() => Model)
  class GenericResolver {
    @Inject(Service) private svc!: ICrudService<T>;

    private abilityFactory?: ICaslAbilityFactory<IUser>;

    @Query(() => Model)
    async [singular](@Args('input', { type: () => FindOneInput }) input: FindOneInput): Promise<T> {
      return transformAndValidate(Model, await this.svc.findOne(input as any));
    }

    @Query(() => FindManyType)
    async [plural](
      @Args({ type: () => FindManyInput }) input: IFindManyArgs<T, PagingStrategy>,
      @CurrentUser() user: IUser,
    ): Promise<IConnection<T>> {
      const finalFilter = this.getFilterForResource(Model, user, input.filter);

      const isCursor = (p: any): p is ICursorPagination => p && Boolean(p.before || p.after);
      const isOffset = (p: any): p is ICursorPagination => p && Boolean(p.limit || p.offset);

      if (isCursor(input.paging)) {
        const withPaging = applyCursorPagingToInput({
          where: convertGraphqlFilterToService(finalFilter),
        });
        return this.svc.findManyAndCount({
          where: withPaging.where,
          order: withPaging.order,
          take: withPaging.take,
        });
      }
      if (isOffset(input.paging)) {
        return this.svc.findManyAndCount({
          where: convertGraphqlFilterToService(finalFilter),
          order: convertGqlOrderByToTypeorm(input.sorting || []),
          skip: input.paging.offset,
          take: input.paging.limit,
        });
      }
      return this.svc.findManyAndCount({ where: convertGraphqlFilterToService(finalFilter) });
    }

    /** filter that only leaves owned rows */
    getFilterForResource(resource: any, user: IUser, origFilter: any = {}): MongoQuery | null {
      if (!user) return origFilter;
      if (resources.includes(resource)) {
        let filter = null;
        if (this.abilityFactory) {
          const ability = this.abilityFactory.createForUser(user);
          filter = ability.rules.find(r => r.action === 'read')?.conditions || {};
        }
        if (filter)
          return merge(origFilter, renameKeyNames(filter, { $elemMatch: 'elemMatch', $eq: 'eq' }));
      }
      throw new Error(`Endpoint for ${resource.name} not defined in resources`);
    }
  }
  if (RequirePrivileges)
    RequirePrivileges([(Model || modelName) as any, Action.Read])(GenericResolver);
  if (AbilityFactory) Inject(AbilityFactory)(GenericResolver.prototype, 'abilityFactory');
  renameFunc(GenericResolver, `Generic${modelName}ReadResolver`);

  return GenericResolver as any;
}
