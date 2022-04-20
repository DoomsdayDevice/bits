import { Inject, Type } from '@nestjs/common';
import { Args, Field, Int, ObjectType, Query, Resolver } from '@nestjs/graphql';
import * as _ from 'lodash';
import { buildRelations } from '@bits/graphql/relation/relation-builder';
import { transformAndValidate } from '@bits/bits.utils';
import { IGrpcService } from '../../grpc/generic-grpc-wrapper.service';
import { Connection, FindOneInput } from './gql-crud.interface';

export function getPlural(modelName: string) {
  if (modelName[modelName.length - 1] === 'y')
    return `${_.camelCase(modelName.slice(0, modelName.length - 1))}ies`;
  return `${_.camelCase(modelName)}s`;
}

export function getSingular(modelName: string) {
  return `${_.camelCase(modelName)}`;
}

function getDefaultModelConnection<T>(Model: Type<T>, modelName: string): any {
  @ObjectType(`${modelName}Connection`)
  class DtoConnectionCls {
    @Field(() => Int)
    totalCount = 0;

    @Field(() => [Model])
    nodes!: T[];
  }
  return DtoConnectionCls;
}

export function ReadResolverMixin<T>(
  Model: Type<T>,
  Service: Type,
  pagination: boolean,
  modelName: string,
): any {
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

  return GenericResolver;
}
