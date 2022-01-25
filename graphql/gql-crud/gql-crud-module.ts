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
import { ReadResolverMixin } from '@bits/graphql/gql-crud/gql-crud.readable.resolver';
import { crudServiceReflector } from '@bits/services/crud.constants';

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

    // assign service to Entity
    crudServiceReflector.set(this.Model, GenericService);

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

  getSort(): any {
    // @InputType()
    // @ArgsType()
    // class MySortType {
    //   @Field(() => Int)
    //   field!: number;
    // }
  }
}
