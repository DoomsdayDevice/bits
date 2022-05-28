import { GrpcMessageDef } from './decorators/message.decorator';
import { GrpcFieldDef } from './decorators/field.decorator';

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
  @GrpcFieldDef(() => 'uint32', { nullable: true })
  limit!: number;

  @GrpcFieldDef(() => 'uint32', { nullable: true })
  offset!: number;
}
