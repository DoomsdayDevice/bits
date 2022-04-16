import { GrpcMessageDef } from './decorators/message.decorator';
import { GrpcFieldDef } from './decorators/field.decorator';

@GrpcMessageDef()
export class FindOneInput {
  @GrpcFieldDef(() => String)
  id!: string;
}

@GrpcMessageDef()
export class OffsetPagination {
  @GrpcFieldDef(() => 'uint32', { nullable: true })
  limit: number;

  @GrpcFieldDef(() => 'uint32', { nullable: true })
  offset: number;
}
