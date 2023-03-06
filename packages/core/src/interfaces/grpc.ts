import {Class, ObjectLiteral} from "../types";
import {IGrpcFilter} from "./filter.grpc";
import {SortDirection} from "../enums";

export interface IStatusMsg {
    success: boolean;
}

export type GMethodInput = {
    name: string;
    service: string;
    requestType: () => Class | string;
    responseType: () => Class | string;
    propertyKey: string;
    descriptor: any;
};

export type GServiceInput = { name: string };

export type GMessageInput = { name: string; oneOf?: boolean };

export type GFieldInput = {
    name: string;
    messageName: string;
    typeFn: () => any;
    rule?: string;
    filterable?: boolean;
    nullable?: boolean;
    listValue?: any;
};

export type GEnumInput = {
    enum: any;
    name: string;
};

/** for clients */
export interface IGrpcService<Enums, WriteModel = any, ReadModel = WriteModel> {
    findOne(opts: { id: string }): Promise<WriteModel>;
    findMany(input: IGrpcFindManyInput<WriteModel, Enums>): Promise<IGrpcFindManyResponse<WriteModel>>;
    deleteOne(input: any): Promise<IStatusMsg>;
    updateOne(input: IUpdateInput<WriteModel>): Promise<WriteModel>;
    createOne(input: any): Promise<WriteModel>;
}
export interface IGrpcFindManyResponse<M> {
    totalCount: number;
    nodes: M[];
}

export interface IGrpcFindManyInput<M, Enums> {
    paging?: IOffsetPagination;

    filter?: IGrpcFilter<M, Enums>;

    sorting?: IListValue<Sort>;
}

export interface IOffsetPagination {
    offset?: number;
    limit?: number;
}


export interface DeleteOneResponse {
    success: boolean;
}

export interface DeleteOneInput {
    id: string;
}

export type ICreateInput<M> = Omit<M, 'createdAt' | 'id'>;

export type IFieldMask = {
    paths: string[];
};

export type IUpdateInput<M> = { update: Partial<M>; updateMask: IFieldMask };

export type IListValue<T> = {
    values: T[];
};
export interface IFindByIdInput {
    id: string;
}
export declare class Sort {
    field: string;
    direction: SortDirection;
}
