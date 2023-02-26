import {FindByIdInput} from "../grpc.dto";
import {Class, ObjectLiteral} from "@bits/core";

export interface IGrpcWriteController<M, RM = M> {
    createOne(newEntity: ICreateInput<M>): Promise<RM>;
    updateOne(update: IUpdateInput<M>): Promise<M>;
    deleteOne(find: ): Promise<DeleteOneResponse>;
}

export interface IGrpcReadController<M> {
    findOne(input: IFindByIdInput): Promise<M>;
    findMany(input: IGrpcFindManyInput<M>): Promise<IGrpcFindManyResponse<M>>;
}

export interface IWritableGrpcControllerOpts<M extends ObjectLiteral, B extends Class, RM = M> {
    WriteModelCls: Class<M>;
    ServiceCls: Class<IWritableCrudService<M>>;
    CreateDTO?: Class;
    DeleteDTO?: Class;
    ReadModelCls?: Class<RM>;
    defineService: boolean;
    Base: B;
    separateRead?: boolean;
}

