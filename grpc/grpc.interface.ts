import { StatusMsg } from '@bits/grpc/grpc-crud/dto/grpc-crud.dto';
import { Type } from '@nestjs/common';
import {
  IGrpcFindManyInput,
  IGrpcFindManyResponse,
  UpdateInput,
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
  listValue?: any;
};

export type GEnumInput = {
  enum: any;
  name: string;
};

/** for clients */
export interface IGrpcService<Enums = never, WriteModel = any, ReadModel = WriteModel> {
  findOne(opts: { id: string }): Promise<WriteModel>;
  findMany(
    input: IGrpcFindManyInput<WriteModel, Enums>,
  ): Promise<IGrpcFindManyResponse<WriteModel>>;
  deleteOne(input: any): Promise<StatusMsg>;
  updateOne(input: UpdateInput<WriteModel>): Promise<StatusMsg>;
  createOne(input: any): Promise<WriteModel>;
}
