import { StatusMsg } from '@bits/grpc/grpc-crud/dto/grpc-crud.dto';
import { Type } from '@nestjs/common';
import {
  IGrpcFindManyInput,
  IGrpcFindManyResponse,
} from '@bits/grpc/grpc-crud/grpc-controller.interface';

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
};

export type GEnumInput = {
  enum: any;
  name: string;
};

/** for clients */
export interface IGrpcService<WriteModel = any, ReadModel = WriteModel> {
  findOne(opts: { id: string }): Promise<WriteModel>;
  findMany(input: IGrpcFindManyInput<WriteModel>): Promise<IGrpcFindManyResponse<WriteModel>>;
  deleteOne(input: any): Promise<StatusMsg>;
  updateOne(input: any): Promise<StatusMsg>;
  createOne(input: any): Promise<WriteModel>;
}
