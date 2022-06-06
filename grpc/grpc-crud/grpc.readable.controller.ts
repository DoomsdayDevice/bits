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
      const filter = this.convertExternalFilterToLocal(input.filter);
      const resp = {
        totalCount: await this.readSvc.count(filter),
        nodes: await this.readSvc.findMany(filter),
      };
      // resp.nodes.forEach(n => {
      //   for (const key of Object.keys(n)) {
      //     if (n[key] instanceof Date) n[key] = n[key].toISOString();
      //   }
      // });
      return resp;
    }

    convertExternalFilterToLocal(filter: any = {}): any {
      const newFilter = {};
      for (const key of Object.keys(filter)) {
        const comparisonField = filter[key];
        if (comparisonField.eq !== undefined) newFilter[key] = comparisonField.eq;
        else if (comparisonField.in) newFilter[key] = In(comparisonField.in.values);
        else if (comparisonField.like) newFilter[key] = Like(comparisonField.like);
        else if (comparisonField.iLike) newFilter[key] = ILike(comparisonField.iLike);
        else {
          newFilter[key] = this.convertExternalFilterToLocal(comparisonField);
        }
      }
      return newFilter;
    }
  }

  if (defineService) GrpcServiceDef(`${ModelCls.name}Service`)(ModelController);
  return ModelController as any;
}
