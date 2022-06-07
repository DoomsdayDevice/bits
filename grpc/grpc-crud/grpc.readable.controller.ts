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
import { ILike, In, Like } from 'typeorm';
import { getOrCreateConnection } from '@bits/grpc/grpc-crud/dto/default-connection.grpc';
import { convertGrpcFilterToTypeorm, convertGrpcOrderByToTypeorm } from '@bits/grpc/grpc.utils';

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
      const order = input.sorting && convertGrpcOrderByToTypeorm(input.sorting.values);
      const resp = {
        totalCount: await this.readSvc.count(filter),
        nodes: await this.readSvc.findMany({ where: filter, order }),
      };
      // resp.nodes.forEach(n => {
      //   for (const key of Object.keys(n)) {
      //     if (n[key] instanceof Date) n[key] = n[key].toISOString();
      //   }
      // });
      return resp;
    }
  }

  if (defineService) GrpcServiceDef(`${ModelCls.name}Service`)(ModelController);
  return ModelController as any;
}
