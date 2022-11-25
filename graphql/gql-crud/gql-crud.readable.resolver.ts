import { Inject, Type } from '@nestjs/common';
import { Args, Query, Resolver } from '@nestjs/graphql';
import { transformAndValidate } from '@bits/dto.utils';
import {
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
import { IGrpcService } from '@bits/grpc/grpc.interface';
import { IConnection } from '@bits/bits.types';
import { AnyAbility, MongoQuery } from '@casl/ability';
import { CurrentUser } from '@bits/auth/current-user.decorator';
import { merge } from 'lodash';
import { IBaseServiceRead, IFindManyArgs } from './gql-crud.interface';

interface ICaslAbilityFactory<IUser> {
  createForUser(u: IUser): AnyAbility;
}

export function ReadResolverMixin<T, N extends string, IUser>(
  Model: Type<T>,
  Service: Type,
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
    @Inject(Service) private svc!: IGrpcService;

    @OptionalInject(CaslAbilityFactory) private abilityFactory?: ICaslAbilityFactory<IUser>;

    @Query(() => Model)
    async [singular](@Args('input', { type: () => FindOneInput }) input: FindOneInput): Promise<T> {
      return transformAndValidate(Model, await this.svc.findOne(input));
    }

    @Query(() => FindManyType)
    async [plural](
      @Args({ type: () => FindManyInput }) { filter }: IFindManyArgs<T>,
      @CurrentUser() user: IUser,
    ): Promise<IConnection<T> | T[]> {
      const userFilter = this.getFilterForResource(Model, user, filter);
      const { nodes, totalCount } = await this.svc.findMany({ filter: userFilter as any });
      // const newNodes = transformAndValidate(Model, nodes);
      if (!pagination) return nodes;
      return {
        totalCount,
        nodes,
      };
    }

    /** filter that only leaves owned rows */
    getFilterForResource(resource: any, user: IUser, origFilter?: any): MongoQuery | null {
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
  renameFunc(GenericResolver, `${modelName}Resolver`);

  return GenericResolver as any;
}
