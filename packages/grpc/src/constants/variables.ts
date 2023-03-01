import {
  GEnumInput,
  GFieldInput,
  GMessageInput,
  GMethodInput,
  GServiceInput,
} from "@bits/core";
import { ArrayReflector, ValueReflector } from "@bits/backend";

export const GRPC_FIELD_KEY = "GRPC_FIELD_KEY";
export const GRPC_METHOD_KEY = "GRPC_METHOD_KEY";
export const GRPC_MESSAGE_KEY = "GRPC_MESSAGE_KEY";

export const fieldReflector = new ArrayReflector(GRPC_FIELD_KEY);
export const methodReflector = new ArrayReflector(GRPC_METHOD_KEY);
export const messageReflector = new ValueReflector(GRPC_MESSAGE_KEY);

export const grpcServices: GServiceInput[] = [];
export const grpcMethods: GMethodInput[] = [];

export const grpcMessages: GMessageInput[] = [];
export const grpcFields: GFieldInput[] = [];

export const grpcEnums: GEnumInput[] = [];
