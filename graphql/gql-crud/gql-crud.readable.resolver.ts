import { Inject, Type } from '@nestjs/common';
import { Args, Query, Resolver } from '@nestjs/graphql';
import { transformAndValidate } from '@bits/dto.utils';
import {
  convertGraphqlFilterToService,
  getPlural,
  getSingular,
  OptionalInject,
  renameFunc,
  renameKeyNames,
} from '@bits/bits.utils';
import {
  FindOneInput,
  getDefaultFindManyArgs,
  getDefaultModelConnection,
} from '@bits/graphql/gql-crud/gql-crud.dto';
import { IConnection } from '@bits/bits.types';
import { AnyAbility, MongoQuery } from '@casl/ability';
import { CurrentUser } from '@bits/auth/current-user.decorator';
import { merge } from 'lodash';
import { ICrudService } from '@bits/services/interface.service';
import { ObjectLiteral } from 'typeorm';
import { IBaseServiceRead, IFindManyArgs } from './gql-crud.interface';

interface ICaslAbilityFactory<IUser> {
  createForUser(u: IUser): AnyAbility;
}

export function ReadResolverMixin<T extends ObjectLiteral, N extends string, IUser>(
  Model: Type<T>,
  Service: Type<ICrudService<T>>,
  pagination: boolean,
  // CurrentUser: () => ParameterDecorator,
  myModelName?: N,
  CaslAbilityFactory?: ICaslAbilityFactory<IUser>,
  resources?: any[],
): Type<IBaseServiceRead<T, N>> {
  const modelName = myModelName || Model.name;
  const plural = getPlural(modelName);
  const singular = getSingular(modelName);

  const DefaultConnection = getDefaultModelConnection(Model, modelName);

  const FindManyType = pagination ? DefaultConnection : [Model];
  const FindManyInput = getDefaultFindManyArgs(Model, modelName);

  @Resolver(() => Model)
  class GenericResolver {
    @Inject(Service) private svc!: ICrudService<T>;

    @OptionalInject(CaslAbilityFactory) private abilityFactory?: ICaslAbilityFactory<IUser>;

    @Query(() => Model)
    async [singular](@Args('input', { type: () => FindOneInput }) input: FindOneInput): Promise<T> {
      return transformAndValidate(Model, await this.svc.findOne(input as any));
    }

    @Query(() => FindManyType)
    async [plural](
      @Args({ type: () => FindManyInput }) { filter }: IFindManyArgs<T>,
      @CurrentUser() user: IUser,
    ): Promise<IConnection<T> | T[]> {
      const finalFilter = this.getFilterForResource(Model, user, filter);

      if (pagination)
        return this.svc.findManyAndCount({
          where: convertGraphqlFilterToService(finalFilter),
        });
      return this.svc.findMany({ where: convertGraphqlFilterToService(finalFilter) });
    }

    /** filter that only leaves owned rows */
    getFilterForResource(resource: any, user: IUser, origFilter: any = {}): MongoQuery | null {
      if (!user) return origFilter;
      if (resources?.includes(resource)) {
        let filter = null;
        if (this.abilityFactory) {
          const ability = this.abilityFactory.createForUser(user);
          filter = ability.rules.find(r => r.action === 'read')?.conditions || {};
        }
        if (filter)
          return merge(origFilter, renameKeyNames(filter, { $elemMatch: 'elemMatch', $eq: 'eq' }));
      }
      return null;
    }
  }
  renameFunc(GenericResolver, `Generic${modelName}Resolver`);

  return GenericResolver as any;
}
