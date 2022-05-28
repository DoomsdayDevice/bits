import { Global, Module, Type } from '@nestjs/common';
import { GqlWritableCrudConfig } from '@bits/graphql/gql-crud/gql-crud.interface';

import { getDefaultGrpcCrudServiceWrapper } from '@bits/grpc/generic-grpc-crud-wrapper.service';
import { CoreClientModule } from '@core/grpc/clients';
import { ReadResolverMixin } from '@bits/graphql/gql-crud/gql-crud.readable.resolver';
import { crudServiceReflector } from '@bits/services/crud.constants';
import { ModuleImportElem } from '@bits/bits.types';
import { WriteResolverMixin } from '@bits/graphql/gql-crud/gql-crud.writable.resolver';
import { buildRelations } from '@bits/graphql/relation/relation-builder';
import { Resolver } from '@nestjs/graphql';
import { DynamicModule } from '@nestjs/common/interfaces/modules/dynamic-module.interface';

export class GqlCrudModule<T> {
  private modelName: string;

  private Model: Type<T>;

  private Resolver?: Type;

  private Service?: Type;

  private pagination: boolean;

  private grpcServiceName: string;

  private imports: ModuleImportElem[];

  constructor({
    Model,
    modelName,
    pagination = true,
    grpcServiceName,
    ModelResolver,
    Service,
    imports,
  }: GqlWritableCrudConfig<T>) {
    this.Model = Model;
    this.modelName = modelName || Model.name;
    this.pagination = pagination;
    this.grpcServiceName = grpcServiceName || `${this.modelName}Service`;
    this.Resolver = ModelResolver;
    this.Service = Service;
    this.imports = imports || [];
  }

  makeReadableCrud(): any {
    const GenericService =
      this.Service || getDefaultGrpcCrudServiceWrapper('CORE_PACKAGE', this.grpcServiceName);
    const GenericResolver =
      this.Resolver ||
      ReadResolverMixin(this.Model, GenericService, this.pagination, this.modelName);

    // assign service to Entity
    crudServiceReflector.set(this.Model, GenericService);

    buildRelations(this.Model, GenericResolver);
    @Global()
    @Module({
      providers: [GenericService, GenericResolver],
      imports: [CoreClientModule, ...this.imports],
      exports: [GenericService],
    })
    class GenericModule {}

    return GenericModule;
  }

  makeWritableCrud(): any {
    const GenericService =
      this.Service || getDefaultGrpcCrudServiceWrapper('CORE_PACKAGE', this.grpcServiceName);
    const GenericResolver =
      this.Resolver ||
      WriteResolverMixin(
        this.Model,
        GenericService,
        this.modelName,
      )(ReadResolverMixin(this.Model, GenericService, this.pagination, this.modelName));

    // assign service to Entity
    crudServiceReflector.set(this.Model, GenericService);

    buildRelations(this.Model, GenericResolver);

    @Global()
    @Module({
      providers: [
        { provide: GenericService.name, useClass: GenericService },
        GenericService,
        GenericResolver,
      ],
      imports: [CoreClientModule, ...this.imports],
      exports: [GenericService, { provide: GenericService.name, useClass: GenericService }],
    })
    class GenericModule {}

    return GenericModule;
  }

  onlyRelations(): DynamicModule {
    @Resolver(() => this.Model)
    class GenericResolver {}

    buildRelations(this.Model, GenericResolver);

    @Module({
      providers: [GenericResolver],
      // imports: [CoreClientModule],
    })
    class GenericModule {}

    return GenericModule as any;
  }
}
