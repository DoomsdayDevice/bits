import { ClassProvider, Global, Module, Type } from '@nestjs/common';

import { getDefaultGrpcCrudServiceWrapper } from '@bits/grpc/generic-grpc-crud-wrapper.service';
import { ReadResolverMixin } from '@bits/graphql/gql-crud/gql-crud.readable.resolver';
import { crudServiceReflector } from '@bits/services/crud.constants';
import { ModuleImportElem } from '@bits/bits.types';
import { WriteResolverMixin } from '@bits/graphql/gql-crud/gql-crud.writable.resolver';
import { buildRelationsForModelResolver } from '@bits/graphql/relation/relation-builder';
import { Field, ObjectType, Resolver } from '@nestjs/graphql';
import { DynamicModule } from '@nestjs/common/interfaces/modules/dynamic-module.interface';
import { getGenericCrudService } from '@bits/db/generic-crud.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ICrudService } from '@bits/services/interface.service';
import { IGrpcService } from '../../grpc/common/types';
import { getKeys, renameFunc } from '@bits/bits.utils';
import { GqlWritableCrudConfig, RelConf } from '@bits/graphql/gql-crud/crud-config.interface';
import { PagingStrategy } from '../../common/paging-strategy.enum';
import { GraphQLUUID } from 'graphql-scalars';
import {
  convertGrpcTypeToTs,
  getGrpcTypeByName,
} from '@bits/graphql/decorators/build-gql-on-grpc-method.decorator';
import { FilterableField } from '@bits/graphql/filter/filter-comparison.factory';
import { endsWith } from 'lodash';
import { getOrCreateModelByName } from '@bits/graphql/gql-crud/get-or-create-model-by-name';
import { GqlRelation } from '@bits/graphql/relation/relation.decorator';
import { Type as TType } from 'class-transformer';

export class GqlCrudModule<
  T extends ModelResource,
  Resources extends readonly any[],
  N extends string,
> {
  private modelName: string;

  private Model: Type<T>;

  private Resolver: Type;

  private Service: Type<ICrudService<T>>;

  private pagination: PagingStrategy;

  private grpcServiceName: string;

  private imports: ModuleImportElem[];

  private type: 'grpc' | 'typeorm';

  private modelIsInResources: any;

  private getResourceNameFromModel: any;

  private abilityFactory: any;

  private RequirePrivileges?: any;

  private relations?: RelConf[];

  private cfg!: GqlWritableCrudConfig<T, N>;

  constructor(cfg: GqlWritableCrudConfig<T, N>) {
    const {
      Model,
      modelName,
      pagination = PagingStrategy.OFFSET,
      grpcServiceName,
      ModelResolver,
      Service,
      imports,
      type = 'typeorm',
      readOnly = false,
      modelIsInResources,
      AbilityFactory,
      RequirePrivileges,
      getResourceNameFromModel,
      relations,
    } = cfg;
    this.cfg = cfg;
    if (relations) this.relations = relations;
    this.Model = Model || this.buildModelFromGrpcName(modelName);
    this.modelName = modelName || this.Model.name;
    this.pagination = pagination;
    this.type = type;
    this.grpcServiceName = grpcServiceName || `${this.modelName}Service`;
    this.imports = imports || [];
    this.modelIsInResources = modelIsInResources;
    this.getResourceNameFromModel = getResourceNameFromModel;

    this.abilityFactory = AbilityFactory;
    this.RequirePrivileges = RequirePrivileges;

    if (!Service) {
      if (type === 'grpc' || grpcServiceName) this.Service = this.buildGrpcService();
      else this.Service = this.buildTypeormService();
    } else this.Service = Service;

    if (!ModelResolver) {
      if (readOnly) this.Resolver = this.buildReadResolver();
      else this.Resolver = this.buildWriteResolver();
    } else this.Resolver = (ModelResolver as ClassProvider).useClass || ModelResolver;
  }

  buildModelFromGrpcName(name?: string): Type {
    if (!name) throw new Error('NO MODEL NAME PROVIDED');

    // get fields

    const Model = getOrCreateModelByName(name);

    // Build specified in config relations
    if (this.relations)
      for (const r of this.relations) {
        if (r.relatedEntity) GqlRelation(() => r.relatedEntity!)(Model.prototype, r.fieldName);
        if (r.relatedEntityByName)
          GqlRelation(() => getOrCreateModelByName(r.relatedEntityByName))(
            Model.prototype,
            r.fieldName,
          );
      }

    const grpcType = getGrpcTypeByName(name);

    for (const f of getKeys(grpcType.fields)) {
      let FieldType: any;
      if (f === 'id' || endsWith(f.toString(), 'Id')) FieldType = GraphQLUUID;
      else FieldType = convertGrpcTypeToTs(grpcType.fields[f].type);
      if (FieldType === Date) {
        TType(() => Date)(Model.prototype, f as string);
      }
      FilterableField(() => FieldType, { name: f.toString() })(Model.prototype, f.toString());
    }
    renameFunc(Model, name);

    return Model;
  }

  buildGrpcService(): Type<ICrudService<T>> {
    return getDefaultGrpcCrudServiceWrapper<IGrpcService<unknown>, any, T>({
      packageToken: 'CORE_PACKAGE',
      DTOCls: this.Model,
      serviceName: this.grpcServiceName,
    });
  }

  buildTypeormService(): Type<ICrudService<T>> {
    this.imports.push(TypeOrmModule.forFeature([this.Model]));

    return getGenericCrudService(this.Model);
  }

  buildWriteResolver(): any {
    return WriteResolverMixin({
      Model: this.Model,
      Service: this.Service,
      modelName: this.modelName,
      RequirePrivileges: this.RequirePrivileges,
      getResourceNameFromModel: this.getResourceNameFromModel,
      modelIsInResources: this.modelIsInResources,
    })(
      ReadResolverMixin({
        Model: this.Model,
        Service: this.Service,
        pagination: this.pagination,
        modelIsInResources: this.modelIsInResources,
        modelName: this.modelName,
        AbilityFactory: this.abilityFactory,
        RequirePrivileges: this.RequirePrivileges,
        getResourceNameFromModel: this.getResourceNameFromModel,
      }),
    );
  }

  buildReadResolver(): any {
    return ReadResolverMixin({
      Model: this.Model,
      Service: this.Service,
      pagination: this.pagination,
      modelIsInResources: this.modelIsInResources,
      getResourceNameFromModel: this.getResourceNameFromModel,

      modelName: this.modelName,
      AbilityFactory: this.abilityFactory,
    });
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
        (this.cfg.ModelResolver as ClassProvider)?.provide
          ? this.cfg.ModelResolver!
          : this.Resolver,
      ],
      imports: [...this.imports],
      exports: [this.Service, { provide: this.Service.name, useClass: this.Service }],
    })
    class GenericModule {}

    return GenericModule as any;
  }

  // makeProxyCrud(): DynamicModule{
  //
  //   crudServiceReflector.set(this.Model, this.Service);
  //
  //   buildRelationsForModelResolver(this.Model, this.Resolver);
  //
  //   @Global()
  //   @Module({
  //     providers: [
  //       { provide: this.Service.name, useClass: this.Service },
  //       this.Service,
  //       this.Resolver,
  //     ],
  //     imports: [...this.imports],
  //     exports: [this.Service, { provide: this.Service.name, useClass: this.Service }],
  //   })
  //   class GenericModule {}
  //
  //   return GenericModule as any;
  // }

  /**  */
  onlyRelations(): DynamicModule {
    @Resolver(() => this.Model)
    class GenericResolver {}
    renameFunc(GenericResolver, `GenericRelOnly${this.Model}Resolver`);
    // TODO раскостылить
    (GenericResolver.prototype as any).svc = {
      getPrimaryColumnName: () => 'id',
    };

    buildRelationsForModelResolver(this.Model, GenericResolver as any);

    @Module({
      providers: [GenericResolver],
      // imports: [CoreClientModule],
    })
    class GenericModule {}

    return GenericModule as any;
  }
}
