import { Type } from '@nestjs/common';
import { IGrpcFindManyInput, IGrpcFindManyResponse, IUpdateInput } from '../index';

export interface IStatusMsg {
  success: boolean;
}

export type GMethodInput = {
  name: string;
  service: string;
  requestType: () => Type | string;
  responseType: () => Type | string;
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
export interface IGrpcService<WriteModel = any, ReadModel = WriteModel> {
  findOne(opts: { id: string }): Promise<WriteModel>;
  findMany(input: IGrpcFindManyInput<WriteModel>): Promise<IGrpcFindManyResponse<WriteModel>>;
  deleteOne(input: any): Promise<IStatusMsg>;
  updateOne(input: IUpdateInput<WriteModel>): Promise<WriteModel>;
  createOne(input: any): Promise<WriteModel>;
}
