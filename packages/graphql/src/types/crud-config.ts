import { ClassProvider, CustomDecorator, Type } from "@nestjs/common";
import { AnyAbility } from "@casl/ability";
import { ObjectLiteral, PagingStrategy } from "@bits/core";
import {
  ICrudModuleProvider,
  ICrudService,
  ModuleImportElem,
  Privilege,
} from "@bits/backend";

export interface ICaslAbilityFactory<IUser> {
  createForUser(u: IUser): AnyAbility;
}

export interface IWriteResolverConfig<
  T extends ObjectLiteral,
  N extends string,
  ResourceName extends string
> extends Omit<IReadResolverConfig<T, N, ResourceName>, "pagination"> {
  Create?: Type;
  Update?: Type;
}

export interface RelConf {
  idFieldName: string;
  fieldName: string;
  relatedEntity?: Type;
  relatedEntityByName?: string;
}

type BaseResolverConfig<ResourceName extends string> = {
  relations?: RelConf[];
  modelIsInResources: (Model: Type) => boolean;
  getResourceNameFromModel: (Model: Type) => string;
  AbilityFactory?: Type<ICaslAbilityFactory<any>>;
  RequirePrivileges?: (
    ...p: Privilege<ResourceName>[]
  ) => CustomDecorator<string>;
};

export type IReadResolverConfig<
  T extends ObjectLiteral,
  N extends string,
  ResourceName extends string
> = BaseResolverConfig<ResourceName> & {
  Model: Type<T>;
  Service: Type<ICrudService<T>>;
  pagination: PagingStrategy;
  modelName?: N;
};

export type ModelResource = ObjectLiteral;

export type GqlCrudConfigBase<
  T extends ModelResource,
  N extends string,
  ResourceName extends string
> = BaseResolverConfig<ResourceName> & {
  Create?: Type<T>;
  Service?: Type<ICrudService<T>>;
  imports?: ModuleImportElem[];
  grpcServiceName?: string;
  pagination?: PagingStrategy;
  ModelResolver?: Type | ClassProvider;
  /** using grpc or simply typeorm */
  readOnly?: boolean;
  provider: ICrudModuleProvider<T>;
};

export type GqlWritableCrudConfig<
  T extends ModelResource,
  N extends string,
  ResourceName extends string
> = GqlCrudConfigBase<T, N, ResourceName> &
  ({ Model: Type<T>; modelName?: N } | { modelName: N });
