import {
  Class,
  DeleteOneResponse,
  FindByIdInput,
  ICreateInput,
  IGrpcFindManyInput,
  IGrpcFindManyResponse,
  IUpdateInput,
  ObjectLiteral,
} from "@bits/core";
import { IFindOptionsWhere, IWritableCrudService } from "@bits/backend";

export interface IGrpcWriteController<M, RM = M> {
  createOne(newEntity: ICreateInput<M>): Promise<RM>;
  updateOne(update: IUpdateInput<M>): Promise<M>;
  deleteOne(find: IFindOptionsWhere<M>): Promise<DeleteOneResponse>;
}

export interface IGrpcReadController<M, Enums> {
  findOne(input: FindByIdInput): Promise<M>;
  findMany(
    input: IGrpcFindManyInput<M, Enums>
  ): Promise<IGrpcFindManyResponse<M>>;
}

export interface IWritableGrpcControllerOpts<
  M extends ObjectLiteral,
  B extends Class,
  RM = M
> {
  WriteModelCls: Class<M>;
  ServiceCls: Class<IWritableCrudService<M>>;
  CreateDTO?: Class;
  DeleteDTO?: Class;
  ReadModelCls?: Class<RM>;
  defineService: boolean;
  Base: B;
  separateRead?: boolean;
}
