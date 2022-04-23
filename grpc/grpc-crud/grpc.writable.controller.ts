import { Controller, Inject, Type } from '@nestjs/common';
import { GrpcServiceDef } from '../decorators/service.decorator';
import { GrpcMethodDef } from '../decorators/method.decorator';
import {
  CreateInput,
  DeleteOneInput,
  DeleteOneResponse,
  IGrpcWriteController,
  UpdateInput,
} from './grpc-controller.interface';
import { IWritableCrudService } from '@bits/services/interface.service';
import {
  getDefaultCreateInput,
  getDefaultDeleteInput,
  getDefaultDeleteResponse,
  getDefaultUpdateInput,
  StatusMsg,
} from '@bits/grpc/grpc-crud/dto/grpc-crud.dto';
import { FindConditions } from 'typeorm';

export function WritableGrpcController<M, B extends Type>(
  ModelCls: Type<M>,
  ServiceCls: Type<IWritableCrudService<M>>,
  CreateDTO?: Type,
  DeleteDTO?: Type,
  defineService = true,
  Base: B = class {} as any,
): Type<IGrpcWriteController<M> & InstanceType<B>> {
  const GenericUpdate = getDefaultUpdateInput(ModelCls);
  const CreateInput = CreateDTO || getDefaultCreateInput(ModelCls);
  const GenericDeleteResp = getDefaultDeleteResponse(ModelCls);
  const GenericDeleteInput = DeleteDTO || getDefaultDeleteInput(ModelCls);

  @Controller()
  class ModelController extends Base implements IGrpcWriteController<M> {
    @Inject(ServiceCls) private writeSvc: IWritableCrudService<M>;

    @GrpcMethodDef({ requestType: () => CreateInput, responseType: () => ModelCls })
    async createOne(newEntity: CreateInput<M>): Promise<M> {
      return this.writeSvc.createOne(newEntity as any);
    }

    @GrpcMethodDef({ requestType: () => GenericUpdate, responseType: () => StatusMsg })
    async updateOne(entity: UpdateInput<M>): Promise<StatusMsg> {
      const res = (await this.writeSvc.updateOne((entity as any).id, entity as any)) as Promise<M>;
      return { success: true };
    }

    @GrpcMethodDef({
      requestType: () => GenericDeleteInput,
      responseType: () => StatusMsg,
    })
    async deleteOne(input: FindConditions<M>): Promise<StatusMsg> {
      return { success: Boolean(await this.writeSvc.deleteOne(input)) };
    }
  }
  if (defineService) GrpcServiceDef(`${ModelCls.name}Service`)(ModelController);
  return ModelController;
}
