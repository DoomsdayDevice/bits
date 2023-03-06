import { SortDirection } from "@bits/core";
import { GrpcFieldDef, GrpcMessageDef } from "./decorators";

@GrpcMessageDef()
export class FindByIdInput {
  @GrpcFieldDef()
  id!: string;
}

@GrpcMessageDef()
export class FindOneNamedInput {
  @GrpcFieldDef()
  name!: string;
}

@GrpcMessageDef()
export class OffsetPagination {
  @GrpcFieldDef(() => "uint32", { nullable: true })
  limit?: number;

  @GrpcFieldDef(() => "uint32", { nullable: true })
  offset?: number;
}

@GrpcMessageDef()
export class Sort {
  @GrpcFieldDef()
  field!: string;

  @GrpcFieldDef(() => "SortDirection")
  direction!: SortDirection;
}
