import { Inject, Type } from '@nestjs/common';
import { Args, Query, Resolver } from '@nestjs/graphql';
import { buildRelations } from '@bits/graphql/relation/relation-builder';
import { transformAndValidate } from '@bits/dto.utils';
import { IBaseServiceRead } from '@ext-types/types';
import { getPlural, getSingular } from '@bits/bits.utils';
import { FindOneInput, getDefaultModelConnection } from '@bits/graphql/gql-crud/gql-crud.dto';
import { IGrpcService } from '@bits/grpc/grpc.interface';
import { Connection } from './gql-crud.interface';

export function ReadResolverMixin<T, N extends string>(
  Model: Type<T>,
  Service: Type,
  pagination: boolean,
  modelName: N,
): Type<IBaseServiceRead<T, N>> {
  const plural = getPlural(modelName);
  const singular = getSingular(modelName);

  const DefaultConnection = getDefaultModelConnection(Model, modelName);

  const FindManyType = pagination ? DefaultConnection : [Model];

  @Resolver(() => Model)
  class GenericResolver {
    @Inject(Service) private svc!: IGrpcService;

    @Query(() => Model)
    async [singular](@Args('input', { type: () => FindOneInput }) input: FindOneInput): Promise<T> {
      return transformAndValidate(Model, await this.svc.findOne(input));
    }

    @Query(() => FindManyType)
    async [plural](): Promise<Connection<T> | T[]> {
      const { nodes } = await this.svc.findMany({});
      // const newNodes = transformAndValidate(Model, nodes);
      if (!pagination) return nodes;
      return {
        totalCount: 1,
        nodes,
      };
    }
  }

  buildRelations(Model, GenericResolver);

  return GenericResolver as any;
}
