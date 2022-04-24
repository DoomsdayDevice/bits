import { Global, Module, Type } from '@nestjs/common';
import { GqlWritableCrudConfig } from '@bits/graphql/gql-crud/gql-crud.interface';

import { getDefaultGrpcServiceWrapper } from '@bits/grpc/generic-grpc-wrapper.service';
import { CoreClientModule } from '@core/grpc/clients';
import { ReadResolverMixin } from '@bits/graphql/gql-crud/gql-crud.readable.resolver';
import { crudServiceReflector } from '@bits/services/crud.constants';
import { ModuleImportElem } from '@bits/bits.types';

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
      this.Service || getDefaultGrpcServiceWrapper('CORE_PACKAGE', this.grpcServiceName);
    const GenericResolver =
      this.Resolver ||
      ReadResolverMixin(this.Model, GenericService, this.pagination, this.modelName);

    // assign service to Entity
    crudServiceReflector.set(this.Model, GenericService);

    @Global()
    @Module({
      providers: [GenericService, GenericResolver],
      imports: [CoreClientModule, ...this.imports],
      exports: [GenericService],
    })
    class GenericModule {}

    return GenericModule;
  }
}
