import { Inject, Type } from '@nestjs/common';
import { Args, Field, Int, ObjectType, Query, Resolver } from '@nestjs/graphql';
import * as _ from 'lodash';
import { buildRelations } from '@bits/graphql/relation/relation-builder';
import { IService } from '../../grpc/generic-grpc-wrapper.service';
import { Connection, FindOneInput } from './gql-crud.interface';

export function getPlural(modelName: string) {
  if (modelName[modelName.length - 1] === 'y')
    return `${_.lowerCase(modelName.slice(0, modelName.length - 1))}ies`;
  return `${_.lowerCase(modelName)}s`;
}

export function getSingular(modelName: string) {
  return `${_.lowerCase(modelName)}`;
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
    @Inject(Service) private svc!: IService;

    @Query(() => Model)
    [singular](@Args('input', { type: () => FindOneInput }) input: FindOneInput): Promise<T> {
      return this.svc.findOne(input);
    }

    @Query(() => FindManyType)
    async [plural](): Promise<Connection<T> | T[]> {
      const { nodes } = await this.svc.findMany({});
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
