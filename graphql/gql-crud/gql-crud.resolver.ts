import { Inject, Type } from '@nestjs/common';
import {
  Args,
  Field,
  Int,
  ObjectType,
  Parent,
  Query,
  ResolveField,
  Resolver,
} from '@nestjs/graphql';
import * as _ from 'lodash';
import { getRelations } from '@bits/graphql/relation/relation.decorator';
import { crudServiceReflector } from '@bits/services/crud.constants';
import { IService } from '../../grpc/generic-grpc-wrapper.service';
import { Connection, FindOneInput } from './gql-crud.interface';

export function getPlural(modelName: string) {
  return `${_.lowerCase(modelName)}s`;
}

export function getSingular(modelName: string) {
  return `${_.lowerCase(modelName)}`;
}

const toInject: { dto: any; resolver: any; svcName: string }[] = [];

export function injectServices() {
  for (const { dto, resolver, svcName } of toInject) {
    const cls = crudServiceReflector.get(dto);
    Inject(cls)(resolver.prototype, svcName);
  }
}

export function buildRelations<T>(DTOCls: Type<T>, CrudResolver: Type) {
  const { one, many } = getRelations(DTOCls);
  if (one)
    for (const r of Object.keys(one)) {
      const relDTO = one[r].DTO;
      Field(() => relDTO)({ constructor: DTOCls }, r);
    }

  if (many)
    for (const r of Object.keys(many)) {
      const svcName = `${r}Service`;
      CrudResolver.prototype[r] = async function (par: any) {
        // get the corresponding service and run
        const svc = this[svcName];
        const roles = await svc.findMany({});

        return roles.nodes;
      };

      CrudResolver.prototype[`${r}Service`] = () => {};
      const dto = many[r].DTO;

      // send to inject service
      toInject.push({ dto, resolver: CrudResolver, svcName });

      Parent()(CrudResolver.prototype, r, 0);

      ResolveField(r, () => [many[r].DTO])(CrudResolver.prototype, r, {
        value: CrudResolver.prototype[r],
      });
    }
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
