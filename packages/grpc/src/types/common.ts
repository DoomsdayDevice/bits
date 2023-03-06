import { Class, ObjectLiteral } from "@bits/core";
import {
  ICrudModuleProvider,
  IReadableRepo,
  IWritableRepo,
} from "@bits/backend";
import { IGrpcWriteController } from "./controller";

export type GrpcFieldOpts = {
  name?: string;
  nullable?: boolean;
  filterable?: boolean;
};

export type IWRRepo<M extends ObjectLiteral> = IWritableRepo<M> &
  IReadableRepo<M>;

interface BaseCrudConfig<M extends ObjectLiteral> {
  Model: Class<M>;
  Repo?: Class<IWRRepo<M>>;
  Controller?: Class<IGrpcWriteController<M>>;
  Service?: Class;
  dataProvider: ICrudModuleProvider<M>;
  imports?: any[];
  providers?: any[];
}

export interface GrpcWritableCrudConfig<M extends ObjectLiteral>
  extends BaseCrudConfig<M> {
  CreateDTO?: Class;
  DeleteDTO?: Class;
}

export interface GrpcReadableCrudConfig<M extends ObjectLiteral>
  extends BaseCrudConfig<M> {
  FindOneDTO?: Class;
  Service?: Class;
  isSimple?: boolean; // no paging, sorting, filtering (for enums and such)
}

export interface GrpcMappedReadableCrudConfig<
  M extends ObjectLiteral,
  E extends ObjectLiteral
> extends GrpcReadableCrudConfig<M> {
  Entity: Class<E>;
}
export interface GrpcMappedWritableCrudConfig<
  M extends ObjectLiteral,
  E extends ObjectLiteral
> extends GrpcWritableCrudConfig<M> {
  Entity: Class<E>;
}
