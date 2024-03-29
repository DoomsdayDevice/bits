import { Type } from "@nestjs/common";
import { memoize } from "lodash";
import { ValidateNested } from "class-validator";
import { Type as TypeTr } from "class-transformer";
import { OmitType, PartialType } from "../utils";
import {
  DeleteOneInput,
  DeleteOneResponse,
  ICreateInput,
  IFieldMask,
  IUpdateInput,
} from "@bits/core";
import { GrpcFieldDef, GrpcMessageDef } from "../decorators";
import { FieldMask } from "./field-mask.grpc";

export const getDefaultUpdateInput = memoize(
  <M>(ModelCls: Type<M>, modelName?: string): Type<IUpdateInput<M>> => {
    @GrpcMessageDef({ name: `${modelName || ModelCls.name}Update` })
    class UpdType extends PartialType(ModelCls as Type) {}

    @GrpcMessageDef({ name: `Update${modelName || ModelCls.name}Input` })
    class GenericUpdateInput {
      @GrpcFieldDef(() => UpdType)
      @ValidateNested()
      @TypeTr(() => UpdType)
      update!: Partial<M>;

      @GrpcFieldDef(() => FieldMask)
      updateMask!: IFieldMask;
    }

    return GenericUpdateInput as any;
  }
);

export function getDefaultDeleteInput<M>(
  ModelCls: Type<M>,
  modelName?: string
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
  modelName?: string
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
  modelName?: string
): Type<ICreateInput<M>> {
  @GrpcMessageDef({ name: `Create${modelName || ModelCls.name}Input` })
  class GenericCreateInput extends (OmitType(ModelCls, [
    "createdAt" as keyof M,
    "id" as keyof M,
  ] as const) as Type) {}

  return GenericCreateInput as any;
}

/** wrapped value */
@GrpcMessageDef()
export class StatusMsg {
  @GrpcFieldDef()
  success!: boolean;
}
