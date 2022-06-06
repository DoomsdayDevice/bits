import { Type } from '@nestjs/common';
import {
  CreateInput,
  DeleteOneInput,
  DeleteOneResponse,
  UpdateInput,
} from '../grpc-controller.interface';
import { GrpcMessageDef } from '../../decorators/message.decorator';
import { OmitType, PartialType } from '../../mapped-types';
import { GrpcFieldDef } from '../../decorators/field.decorator';

export function getDefaultUpdateInput<M>(
  ModelCls: Type<M>,
  modelName?: string,
): Type<UpdateInput<M>> {
  @GrpcMessageDef({ name: `Update${modelName || ModelCls.name}Input` })
  class GenericUpdateInput extends PartialType(ModelCls as Type) {}

  return GenericUpdateInput as any;
}

export function getDefaultDeleteInput<M>(
  ModelCls: Type<M>,
  modelName?: string,
): Type<DeleteOneInput> {
  @GrpcMessageDef({ name: `Delete${modelName || ModelCls.name}Input` })
  class GenericDeleteInput {
    @GrpcFieldDef()
    id!: string;
  }
  return GenericDeleteInput;
}

export function getDefaultDeleteResponse<M>(
  ModelCls: Type<M>,
  modelName?: string,
): Type<DeleteOneResponse> {
  @GrpcMessageDef({ name: `Delete${modelName || ModelCls.name}Response` })
  class GenericDeleteResponse {
    @GrpcFieldDef()
    success!: boolean;
  }
  return GenericDeleteResponse;
}

export function getDefaultCreateInput<M>(
  ModelCls: Type<M>,
  modelName?: string,
): Type<CreateInput<M>> {
  @GrpcMessageDef({ name: `Create${modelName || ModelCls.name}Input` })
  class GenericCreateInput extends (OmitType(ModelCls, [
    'createdAt' as keyof M,
    'id' as keyof M,
  ] as const) as Type) {}

  return GenericCreateInput as any;
}

/** wrapped value */
@GrpcMessageDef()
export class StatusMsg {
  @GrpcFieldDef()
  success!: boolean;
}
