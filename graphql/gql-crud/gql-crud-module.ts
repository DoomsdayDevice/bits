import { Global, Module, Type } from '@nestjs/common';
import { GqlWritableCrudConfig } from '@bits/graphql/gql-crud/gql-crud.interface';

import { getDefaultGrpcCrudServiceWrapper } from '@bits/grpc/generic-grpc-crud-wrapper.service';
import { ReadResolverMixin } from '@bits/graphql/gql-crud/gql-crud.readable.resolver';
import { crudServiceReflector } from '@bits/services/crud.constants';
import { ModuleImportElem } from '@bits/bits.types';
import { WriteResolverMixin } from '@bits/graphql/gql-crud/gql-crud.writable.resolver';
import { buildRelationsForModelResolver } from '@bits/graphql/relation/relation-builder';
import { Resolver } from '@nestjs/graphql';
import { DynamicModule } from '@nestjs/common/interfaces/modules/dynamic-module.interface';
import { getGenericCrudService } from '@bits/db/generic-crud.service';
import { ObjectLiteral } from 'typeorm';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ICrudService } from '@bits/services/interface.service';
import { IGrpcService } from '@bits/grpc/grpc.interface';

export class GqlCrudModule<T extends ObjectLiteral> {
  private modelName: string;

  private Model: Type<T>;

  private Resolver: Type;

  private Service: Type<ICrudService<T>>;

  private pagination: boolean;

  private grpcServiceName: string;

  private imports: ModuleImportElem[];

  private type: 'grpc' | 'typeorm';

  private resources: readonly any[];

  private abilityFactory: any;

  constructor({
    Model,
    modelName,
    pagination = true,
    grpcServiceName,
    ModelResolver,
    Service,
    imports,
    type = 'typeorm',
    readOnly = false,
    resources,
    abilityFactory,
  }: GqlWritableCrudConfig<T>) {
    this.Model = Model;
    this.modelName = modelName || Model.name;
    this.pagination = pagination;
    this.type = type;
    this.grpcServiceName = grpcServiceName || `${this.modelName}Service`;
    this.imports = imports || [];
    this.resources = resources;
    this.abilityFactory = abilityFactory;

    if (!Service) {
      if (type === 'grpc' || grpcServiceName) this.Service = this.buildGrpcService();
      else this.Service = this.buildTypeormService();
    } else this.Service = Service;

    if (!ModelResolver) {
      if (readOnly) this.Resolver = this.buildReadResolver();
      else this.Resolver = this.buildWriteResolver();
    } else this.Resolver = ModelResolver;
  }

  buildGrpcService(): Type<ICrudService<T>> {
    return getDefaultGrpcCrudServiceWrapper<IGrpcService<unknown>, any, T>(
      'CORE_PACKAGE',
      this.grpcServiceName,
    );
  }

  buildTypeormService(): Type<ICrudService<T>> {
    this.imports.push(TypeOrmModule.forFeature([this.Model]));

    return getGenericCrudService(this.Model);
  }

  buildWriteResolver(): any {
    return WriteResolverMixin(
      this.Model,
      this.Service,
      this.modelName,
    )(
      ReadResolverMixin(
        this.Model,
        this.Service,
        this.pagination,
        this.resources,
        this.modelName,
        this.abilityFactory,
      ),
    );
  }

  buildReadResolver(): any {
    return ReadResolverMixin(
      this.Model,
      this.Service,
      this.pagination,
      this.resources,
      this.modelName,
      this.abilityFactory,
    );
  }

  makeCrud(): DynamicModule {
    // assign service to Entity
    crudServiceReflector.set(this.Model, this.Service);

    buildRelationsForModelResolver(this.Model, this.Resolver);

    @Global()
    @Module({
      providers: [
        { provide: this.Service.name, useClass: this.Service },
        this.Service,
        this.Resolver,
      ],
      imports: [...this.imports],
      exports: [this.Service, { provide: this.Service.name, useClass: this.Service }],
    })
    class GenericModule {}

    return GenericModule as any;
  }

  onlyRelations(): DynamicModule {
    @Resolver(() => this.Model)
    class GenericResolver {}

    buildRelationsForModelResolver(this.Model, GenericResolver);

    @Module({
      providers: [GenericResolver],
      // imports: [CoreClientModule],
    })
    class GenericModule {}

    return GenericModule as any;
  }
}
