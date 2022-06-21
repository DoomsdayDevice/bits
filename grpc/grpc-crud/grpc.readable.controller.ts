import { Controller, Inject, Type } from '@nestjs/common';
import {
  IGrpcFindManyInput,
  IGrpcFindManyResponse,
  IGrpcReadController,
} from './grpc-controller.interface';
import { GrpcMethodDef } from '../decorators/method.decorator';
import { GrpcServiceDef } from '../decorators/service.decorator';
import { FindByIdInput } from '../grpc.dto';
import { getOrCreateFindManyInput } from '@bits/grpc/grpc-crud/dto/default-find-many-input.grpc';
import { IReadableCrudService } from '@bits/services/interface.service';
import { getOrCreateConnection } from '@bits/grpc/grpc-crud/dto/default-connection.grpc';
import { convertGrpcFilterToTypeorm } from '@bits/grpc/grpc.utils';
import { convertGrpcOrderByToTypeorm } from '@bits/db/db.utils';

export type AnyConstructor<A = object> = new (...input: any[]) => A;

export function ReadableGrpcController<M, B extends AnyConstructor>(
  ModelCls: Type<M>,
  ServiceCls: Type<IReadableCrudService<M>>,
  defineService = true,
  Base: B = class {} as any,
  FindOneInputDTO?: Type,
): Type<IGrpcReadController<M> & InstanceType<B>> {
  const FindMany = getOrCreateFindManyInput(ModelCls);
  const FindManyResp = getOrCreateConnection(ModelCls);
  const FinalFindOneInput = FindOneInputDTO || FindByIdInput;

  @Controller()
  class ModelController extends Base implements IGrpcReadController<M> {
    @Inject(ServiceCls) private readSvc: IReadableCrudService<M>;

    @GrpcMethodDef({ requestType: () => FinalFindOneInput, responseType: () => ModelCls })
    async findOne(input: FindByIdInput): Promise<M> {
      return this.readSvc.findOne(input as any);
    }

    @GrpcMethodDef({
      requestType: () => FindMany,
      responseType: () => FindManyResp,
    })
    async findMany(input: IGrpcFindManyInput<M>): Promise<IGrpcFindManyResponse<M>> {
      const filter = convertGrpcFilterToTypeorm(input.filter);
      // const ans = await convertGrpcFilterToUcast(input.filter).getMany();
      const order = input.sorting && convertGrpcOrderByToTypeorm(input.sorting.values);

      return this.readSvc.findManyAndCount({
        where: filter,
        orderBy: order as any,
      });
    }
  }

  if (defineService) GrpcServiceDef(`${ModelCls.name}Service`)(ModelController);
  return ModelController as any;
}
