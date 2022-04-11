import { DynamicModule, Global, Inject, Injectable, Module, Type } from '@nestjs/common';
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
import { ReadResolverMixin } from '@bits/graphql/gql-crud/gql-crud.resolver';

export class GqlCrudModule<T> {
  private modelName: string;

  private Model: Type<T>;

  private Resolver?: Type;

  private Service?: Type;

  private pagination: boolean;

  private grpcServiceName?: string;

  constructor({
    Model,
    modelName,
    pagination = true,
    grpcServiceName,
    ModelResolver,
    Service,
  }: GqlWritableCrudConfig<T>) {
    this.modelName = modelName;
    this.Model = Model;
    this.pagination = pagination;
    this.grpcServiceName = grpcServiceName;
    this.Resolver = ModelResolver;
    this.Service = Service;
  }

  makeReadableCrud(): any {
    const GenericService =
      this.Service ||
      getGenericGrpcWrapper('CORE_PACKAGE', this.grpcServiceName || 'GenericSvc', this.Model);
    const GenericResolver =
      this.Resolver ||
      ReadResolverMixin(this.Model, GenericService, this.pagination, this.modelName);

    @Global()
    @Module({
      providers: [GenericService, GenericResolver],
      imports: [CoreClientModule],
      exports: [GenericService],
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

  getCreate(): any {
    // CreateDTOClass = OmitType(
    //   Entity,
    //   ['deletedAt', 'createdAt', 'updatedAt', 'id'] as const,
    //   InputType.bind(null, `Create${Entity.name}`),
    // ),
  }
}
