import { GrpcMessageDef, GrpcFieldDef } from '.';

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

export enum SortDirection {
  ASC = 'ASC',
  DESC = 'DESC',
}

@GrpcMessageDef()
export class Sort {
  @GrpcFieldDef()
  field!: string;

  @GrpcFieldDef(() => 'SortDirection')
  direction!: SortDirection;
}
