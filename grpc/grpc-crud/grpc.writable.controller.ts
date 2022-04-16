import { Controller, Inject, Type } from '@nestjs/common';
import { GrpcServiceDef } from '../decorators/service.decorator';
import { GrpcMethodDef } from '../decorators/method.decorator';
import {
  CreateInput,
  DeleteOneInput,
  DeleteOneResponse,
  Filter,
  FindManyInput,
  FindManyResponse,
  IGrpcWriteController,
  UpdateInput,
} from './grpc-controller.interface';
import { IWritableRepo, IWRRepo } from '../../db/repo.interface';
import { GrpcMessageDef } from '../decorators/message.decorator';
import { GrpcFieldDef } from '../decorators/field.decorator';
import { OmitType, PartialType } from '../mapped-types';
import { ReadableGrpcController } from '@bits/grpc/grpc-crud/grpc.readable.controller';

function getDefaultUpdateInput<M>(ModelCls: Type<M>): Type<UpdateInput<M>> {
  @GrpcMessageDef({ name: `Update${ModelCls.name}Input` })
  class GenericUpdateInput extends PartialType(ModelCls as Type) {}

  return GenericUpdateInput as any;
}

function getDefaultDeleteInput<M>(ModelCls: Type<M>): Type<DeleteOneInput> {
  @GrpcMessageDef({ name: `Delete${ModelCls.name}Input` })
  class GenericDeleteInput {
    @GrpcFieldDef(() => String)
    id: string;
  }
  return GenericDeleteInput;
}

function getDefaultDeleteResponse<M>(ModelCls: Type<M>): Type<DeleteOneResponse> {
  @GrpcMessageDef({ name: `Delete${ModelCls.name}Response` })
  class GenericDeleteResponse {
    @GrpcFieldDef(() => Boolean)
    success: boolean;
  }
  return GenericDeleteResponse;
}

function getDefaultCreateInput<M>(ModelCls: Type<M>): Type<CreateInput<M>> {
  @GrpcMessageDef({ name: `Create${ModelCls.name}Input` })
  class GenericCreateInput extends (OmitType(ModelCls, ['createdAt', 'id'] as const) as Type) {}

  return GenericCreateInput as any;
}

export function WritableGrpcController<M, B extends Type>(
  ModelCls: Type<M>,
  RepoCls: Type<IWRRepo<M>>,
  defineService = true,
  Base: B = class {} as any,
): Type<IGrpcWriteController<M> & InstanceType<B>> {
  const GenericUpdate = getDefaultUpdateInput(ModelCls);
  const GenericCreateInput = getDefaultCreateInput(ModelCls);
  const GenericDeleteResp = getDefaultDeleteResponse(ModelCls);
  const GenericDeleteInput = getDefaultDeleteInput(ModelCls);

  @Controller()
  class ModelController extends Base implements IGrpcWriteController<M> {
    @Inject(RepoCls) private repo: IWritableRepo<M>;

    @GrpcMethodDef({ requestType: () => GenericCreateInput, responseType: () => ModelCls })
    async createOne(newEntity: CreateInput<M>): Promise<M> {
      return this.repo.repository.save(newEntity as any);
    }

    @GrpcMethodDef({ requestType: () => GenericUpdate, responseType: () => ModelCls })
    async updateOne(entity: UpdateInput<M>): Promise<M> {
      return this.repo.repository.save(entity as any);
    }

    @GrpcMethodDef({
      requestType: () => GenericDeleteInput,
      responseType: () => GenericDeleteResp,
    })
    async deleteOne(entity: DeleteOneInput): Promise<DeleteOneResponse> {
      return { success: Boolean(await this.repo.repository.delete(entity.id)) };
    }
  }
  if (defineService) GrpcServiceDef(`${ModelCls.name}Service`)(ModelController);
  return ModelController;
}
