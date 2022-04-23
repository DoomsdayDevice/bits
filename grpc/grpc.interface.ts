import { Connection } from '@bits/graphql/gql-crud/gql-crud.interface';
import { StatusMsg } from '@apis/core';

export type GMethodInput = {
  name: string;
  service: string;
  requestType: () => string;
  responseType: () => string;
  propertyKey: string;
  descriptor: any;
};

export type GServiceInput = { name: string };

export type GMessageInput = { name: string };

export type GFieldInput = {
  name: string;
  messageName: string;
  typeFn: () => any;
  rule?: string;
  filterable?: boolean;
  nullable: boolean;
};

export type GEnumInput = {
  enum: any;
  name: string;
};

/** for clients */
export interface IGrpcService<T = any> {
  findOne(opts: { id: string }): Promise<T>;
  findMany(input: any): Promise<Connection<T>>;
  deleteOne(input: any): Promise<StatusMsg>;
  updateOne(input: any): Promise<StatusMsg>;
  createOne(input: any): Promise<T>;
}
