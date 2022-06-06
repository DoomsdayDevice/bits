import { Controller, Inject, Type } from '@nestjs/common';
import { GrpcServiceDef } from '../decorators/service.decorator';
import { GrpcMethodDef } from '../decorators/method.decorator';
import {
  CreateInput,
  DeleteOneInput,
  DeleteOneResponse,
  IGrpcWriteController,
  IWritableGrpcControllerOpts,
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

export function WritableGrpcController<WriteModel, B extends Type, ReadModel = WriteModel>({
  WriteModelCls,
  ServiceCls,
  CreateDTO,
  DeleteDTO,
  ReadModelCls = WriteModelCls,
  defineService = true,
  Base = class {} as any,
  separateRead = false,
}: IWritableGrpcControllerOpts<WriteModel, B>): Type<
  IGrpcWriteController<WriteModel, ReadModel> & InstanceType<B>
> {
  const GenericUpdate = getDefaultUpdateInput(WriteModelCls, ReadModelCls.name);
  const CreateInput = CreateDTO || getDefaultCreateInput(WriteModelCls, ReadModelCls.name);
  const GenericDeleteResp = getDefaultDeleteResponse(WriteModelCls, ReadModelCls.name);
  const GenericDeleteInput = DeleteDTO || getDefaultDeleteInput(WriteModelCls, ReadModelCls.name);

  @Controller()
  class WriteModelController extends Base implements IGrpcWriteController<WriteModel, ReadModel> {
    @Inject(ServiceCls) private writeSvc: IWritableCrudService<WriteModel>;

    @GrpcMethodDef({ requestType: () => CreateInput, responseType: () => ReadModelCls })
    async createOne(newEntity: CreateInput<WriteModel>): Promise<ReadModel> {
      const writeRes = await this.writeSvc.createOne(newEntity as any);
      if (separateRead && (this as any).readSvc && (writeRes as any).id) {
        return this.readSvc.findOne({ id: (writeRes as any).id } as any);
      }
      return writeRes as unknown as ReadModel;
    }

    @GrpcMethodDef({ requestType: () => GenericUpdate, responseType: () => StatusMsg })
    async updateOne(entity: UpdateInput<WriteModel>): Promise<StatusMsg> {
      const res = (await this.writeSvc.updateOne(
        (entity as any).id,
        entity as any,
      )) as unknown as Promise<WriteModel>;
      return { success: true };
    }

    @GrpcMethodDef({
      requestType: () => GenericDeleteInput,
      responseType: () => StatusMsg,
    })
    async deleteOne(input: FindConditions<WriteModel>): Promise<StatusMsg> {
      return { success: Boolean(await this.writeSvc.deleteOne(input)) };
    }
  }
  if (defineService) GrpcServiceDef(`${WriteModelCls.name}Service`)(WriteModelController);
  return WriteModelController;
}
