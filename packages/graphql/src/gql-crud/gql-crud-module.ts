import { ClassProvider, Global, Module, Type } from "@nestjs/common";

import { Resolver } from "@nestjs/graphql";
import { DynamicModule } from "@nestjs/common/interfaces/modules/dynamic-module.interface";
import { PagingStrategy, renameFunc } from "@bits/core";
import { ICrudService, ModuleImportElem, RelConf } from "@bits/backend";
import { GqlWritableCrudConfig, ModelResource } from "../types";
import { WriteResolverMixin } from "./gql-crud.writable.resolver";
import { ReadResolverMixin } from "./gql-crud.readable.resolver";
import {
  buildRelationsForModelResolver,
  crudServiceReflector,
} from "../relation";

export class GqlCrudModule<
  T extends ModelResource,
  Resources extends readonly any[],
  N extends string,
  ResourceName extends string
> {
  private modelName: string;

  private Model: Type<T>;

  private Resolver: Type;

  private Service: Type<ICrudService<T>>;

  private pagination: PagingStrategy;

  private imports: ModuleImportElem[];

  private modelIsInResources: any;

  private getResourceNameFromModel: any;

  private abilityFactory: any;

  private RequirePrivileges?: any;

  private relations?: RelConf[];

  constructor(private cfg: GqlWritableCrudConfig<T, N, ResourceName>) {
    const {
      modelName,
      pagination = PagingStrategy.OFFSET,
      ModelResolver,
      Service,
      imports,
      readOnly = false,
      modelIsInResources,
      AbilityFactory,
      RequirePrivileges,
      getResourceNameFromModel,
      relations,
    } = cfg;
    if (relations) this.relations = relations;
    this.Model =
      "Model" in cfg
        ? cfg.Model
        : this.cfg.provider.buildModelFromName(
            modelName!,
            modelName,
            "object",
            relations
          );

    if (!this.cfg.Create && !readOnly && modelName)
      this.cfg.Create = this.cfg.provider.buildModelFromName(
        `CreateOne${modelName}Input`,
        `Create${modelName}Input`,
        "input",
        this.relations
      );
    this.modelName = modelName || this.Model.name;
    this.pagination = pagination;
    this.imports = imports || [];
    this.modelIsInResources = modelIsInResources;
    this.getResourceNameFromModel = getResourceNameFromModel;

    this.abilityFactory = AbilityFactory;
    this.RequirePrivileges = RequirePrivileges;

    if (!Service) {
      this.Service = this.cfg.provider.buildService();
    } else this.Service = Service;

    if (!ModelResolver) {
      if (readOnly) this.Resolver = this.buildReadResolver();
      else this.Resolver = this.buildWriteResolver();
    } else
      this.Resolver =
        (ModelResolver as ClassProvider).useClass || (ModelResolver as Type);
  }

  buildWriteResolver(): any {
    return WriteResolverMixin({
      Model: this.Model,
      Service: this.Service,
      modelName: this.modelName,
      Create: this.cfg.Create,
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
      })
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
      exports: [
        this.Service,
        { provide: this.Service.name, useClass: this.Service },
      ],
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
      getPrimaryColumnName: () => "id",
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
