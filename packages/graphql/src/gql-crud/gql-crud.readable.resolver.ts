import { Inject, Type } from "@nestjs/common";
import { Args, Query, Resolver } from "@nestjs/graphql";
import { MongoQuery } from "@casl/ability";
import { merge } from "lodash";
import {
  ICaslAbilityFactory,
  IReadResolverConfig,
  ModelResource,
} from "../types";
import {
  getPlural,
  getSingular,
  IBaseReadResolver,
  IConnection,
  ICursorPagination,
  IFindManyArgs,
  PagingStrategy,
  renameFunc,
  renameKeyNames,
} from "@bits/core";
import { Action, ICrudService, transformAndValidate } from "@bits/backend";
import { CurrentUser } from "../decorators";
import {
  applyCursorPagingToInput,
  convertGqlOrderByToTypeorm,
  convertGraphqlFilterToService,
} from "@bits/backend/lib/conversions";
import { getDefaultModelConnection } from "../dto";
import { FindOneInput, getDefaultFindManyArgs } from "../inputs";

export function ReadResolverMixin<
  T extends ModelResource,
  N extends string,
  IUser,
  ResourceName extends string
>({
  Model,
  Service,
  pagination,
  modelIsInResources,
  modelName = Model.name as N,
  AbilityFactory,
  RequirePrivileges,
  getResourceNameFromModel,
}: IReadResolverConfig<T, N, ResourceName>): Type<IBaseReadResolver<T, N>> {
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
    async [singular](
      @Args("input", { type: () => FindOneInput }) input: FindOneInput
    ): Promise<T> {
      return transformAndValidate(Model, await this.svc.findOne(input as any));
    }

    @Query(() => FindManyType)
    async [plural](
      @Args({ type: () => FindManyInput })
      input: IFindManyArgs<T, PagingStrategy>,
      @CurrentUser() user: IUser
    ): Promise<IConnection<T>> {
      const finalFilter =
        this.getFilterForResource(Model, user, input.filter) || {};

      const isCursor = (p: any): p is ICursorPagination =>
        p && Boolean(p.before || p.after);
      const isOffset = (p: any): p is ICursorPagination =>
        p && Boolean(p.limit || p.offset);

      if (isCursor(input.paging)) {
        const withPaging = applyCursorPagingToInput({
          where: convertGraphqlFilterToService(finalFilter as any),
        });
        return this.svc.findManyAndCount({
          where: withPaging.where,
          order: withPaging.order,
          take: withPaging.take,
        });
      }
      if (isOffset(input.paging)) {
        return this.svc.findManyAndCount({
          where: convertGraphqlFilterToService(finalFilter as any), //TODO
          order: convertGqlOrderByToTypeorm(input.sorting || []),
          skip: input.paging.offset,
          take: input.paging.limit,
        });
      }

      return this.svc.findManyAndCount({
        where: convertGraphqlFilterToService(finalFilter as any),
        order: convertGqlOrderByToTypeorm(input.sorting || []),
      });
    }

    /** filter that only leaves owned rows */
    getFilterForResource(
      Model: Type,
      user: IUser,
      origFilter: any = {}
    ): MongoQuery | null {
      if (!user) return origFilter;
      if (modelIsInResources(Model)) {
        let filter = null;
        if (this.abilityFactory) {
          const ability = this.abilityFactory.createForUser(user);
          filter =
            ability.rules.find((r) => r.action === "read")?.conditions || {};
        }
        if (filter)
          return merge(
            origFilter,
            renameKeyNames(filter, { $elemMatch: "elemMatch", $eq: "eq" })
          );
      }
      throw new Error(`Endpoint for ${Model.name} not defined in resources`);
    }
  }
  if (RequirePrivileges)
    RequirePrivileges([
      (modelName || getResourceNameFromModel(Model)) as any,
      Action.Read,
    ])(GenericResolver);
  if (AbilityFactory)
    Inject(AbilityFactory)(GenericResolver.prototype, "abilityFactory");
  renameFunc(GenericResolver, `Generic${modelName}ReadResolver`);

  return GenericResolver as any;
}
