import { GrpcMessageDef } from '../../decorators/message.decorator';
import { GrpcFieldDef } from '../../decorators/field.decorator';

@GrpcMessageDef()
export class FieldMask {
  @GrpcFieldDef(() => [String])
  paths!: string[];
}
