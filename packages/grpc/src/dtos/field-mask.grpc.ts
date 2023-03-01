import { GrpcFieldDef, GrpcMessageDef } from "../decorators";

@GrpcMessageDef()
export class FieldMask {
  @GrpcFieldDef(() => [String])
  paths!: string[];
}
