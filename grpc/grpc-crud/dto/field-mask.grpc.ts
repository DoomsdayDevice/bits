import { GrpcFieldDef, GrpcMessageDef } from '@bits/grpc';

@GrpcMessageDef()
export class FieldMask {
  @GrpcFieldDef(() => [String])
  paths!: string[];
}
