import { DynamicModule, Inject, Injectable, Module, Type } from '@nestjs/common';
import {
  GqlWritableCrudConfig,
  Connection,
  FindOneInput,
} from '@bits/graphql/gql-crud/gql-crud.interface';
import { Args, Field, Int, ObjectType, Query, Resolver } from '@nestjs/graphql';
import * as _ from 'lodash';
import * as core from '@apis/core';

import { getGenericGrpcWrapper, IService } from '@bits/grpc/generic-grpc-wrapper.service';
import { CoreClientModule } from '@core/grpc/clients';

export class GqlCrudModule<T> {
  private modelName: string;

  private Model: Type<T>;

  private pagination: boolean;

  private grpcServiceName: string;

  constructor({ Model, modelName, pagination = true, grpcServiceName }: GqlWritableCrudConfig<T>) {
    this.modelName = modelName;
    this.Model = Model;
    this.pagination = pagination;
    this.grpcServiceName = grpcServiceName;
  }

  makeReadableCrud(): any {
    const GenericService = getGenericGrpcWrapper<core.UserService>(
      'CORE_PACKAGE',
      this.grpcServiceName,
    );
    const GenericResolver = this.getReadableResolver(GenericService);

    @Module({
      providers: [GenericService, GenericResolver],
      imports: [CoreClientModule],
    })
    class GenericModule {}

    return GenericModule;
  }

  getService(): any {
    @Injectable()
    class Service {}
    return Service;
  }

  getUpdate(): any {
    // @InputType(`UpdateOne${Entity.name}Input`)
    // class UpdateOneInput {
    //   @Field(() => GraphQLUUID)
    //   id!: string;
    //
    //   @Field(() => UpdateDTOClass)
    //   @CTType(() => UpdateDTOClass)
    //   @ValidateNested()
    //   update!: any;
    // }
    // UpdateDTOClass = PartialType(
    //   OmitType(Entity, ['deletedAt', 'createdAt', 'updatedAt', 'id'] as const),
    //   InputType.bind(null, `Update${Entity.name}`),
    // ),
  }

  getSort(): any {
    // @InputType()
    // @ArgsType()
    // class MySortType {
    //   @Field(() => Int)
    //   field!: number;
    // }
  }

  getReadableResolver(Service: Type): any {
    const plural = this.getPlural();
    const singular = this.getSingular();
    const DefaultConnection = this.getDefaultModelConnection();
    const { pagination } = this;

    const FindManyType = pagination ? DefaultConnection : [this.Model];

    @Resolver(() => this.Model)
    class GenericResolver {
      @Inject(Service) private svc!: IService;

      @Query(() => this.Model)
      [singular](@Args('input', { type: () => FindOneInput }) input: FindOneInput): Promise<T> {
        return this.svc.findOne(input);
      }

      @Query(() => FindManyType)
      async [plural](): Promise<Connection<T> | T[]> {
        const { nodes } = await this.svc.findMany({});
        console.log(nodes, pagination);
        if (!pagination) return nodes;
        return {
          totalCount: 1,
          nodes,
        };
      }
    }

    return GenericResolver;
  }

  getDefaultModelConnection(): any {
    @ObjectType(`${this.modelName}Connection`)
    class DtoConnectionCls {
      @Field(() => Int)
      totalCount = 0;

      @Field(() => [this.Model])
      nodes!: T[];
    }
    return DtoConnectionCls;
  }

  getCreate(): any {
    // CreateDTOClass = OmitType(
    //   Entity,
    //   ['deletedAt', 'createdAt', 'updatedAt', 'id'] as const,
    //   InputType.bind(null, `Create${Entity.name}`),
    // ),
  }

  getPlural() {
    return `${_.lowerCase(this.modelName)}s`;
  }

  getSingular() {
    return `${_.lowerCase(this.modelName)}`;
  }
}
