import { Inject, Type } from '@nestjs/common';
import { Args, Query, Resolver } from '@nestjs/graphql';
import { transformAndValidate } from '@bits/dto.utils';
import { IBaseServiceRead } from '@api-types/types';
import { getPlural, getSingular, renameFunc } from '@bits/bits.utils';
import {
  FindOneInput,
  getDefaultFindManyArgs,
  getDefaultModelConnection,
} from '@bits/graphql/gql-crud/gql-crud.dto';
import { IGrpcService } from '@bits/grpc/grpc.interface';
import { IConnection } from '@bits/bits.types';
import { IGrpcUser } from '@api-types/user/user.grpc.type';
import { IFindManyArgs } from './gql-crud.interface';
import { CurrentUser } from '../../../../src/auth/decorators/user.decorator';
import { AuthService } from '../../../../src/auth/auth.service';

export function ReadResolverMixin<T, N extends string>(
  Model: Type<T>,
  Service: Type,
  pagination: boolean,
  myModelName?: N,
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

    @Inject(AuthService) private authSvc!: AuthService;

    @Query(() => Model)
    async [singular](@Args('input', { type: () => FindOneInput }) input: FindOneInput): Promise<T> {
      return transformAndValidate(Model, await this.svc.findOne(input));
    }

    @Query(() => FindManyType)
    async [plural](
      @Args({ type: () => FindManyInput }) { filter }: IFindManyArgs<T>,
      @CurrentUser() user: IGrpcUser,
    ): Promise<IConnection<T> | T[]> {
      const userFilter = this.authSvc.getFilterForResource(Model, user, filter);
      const { nodes, totalCount } = await this.svc.findMany({ filter: userFilter as any });
      // const newNodes = transformAndValidate(Model, nodes);
      if (!pagination) return nodes;
      return {
        totalCount,
        nodes,
      };
    }
  }
  renameFunc(GenericResolver, `${modelName}Resolver`);

  return GenericResolver as any;
}
