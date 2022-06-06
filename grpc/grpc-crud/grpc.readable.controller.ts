import { Controller, Inject, Type } from '@nestjs/common';
import {
  IGrpcFindManyInput,
  IGrpcFindManyResponse,
  IGrpcReadController,
} from './grpc-controller.interface';
import { GrpcMethodDef } from '../decorators/method.decorator';
import { GrpcServiceDef } from '../decorators/service.decorator';
import { GrpcMessageDef } from '../decorators/message.decorator';
import { GrpcFieldDef } from '../decorators/field.decorator';
import { FindByIdInput } from '../grpc.dto';
import { getDefaultFindManyInput } from '@bits/grpc/grpc-crud/dto/default-find-many-input.grpc';
import { IReadableCrudService } from '@bits/services/interface.service';
import { ILike, In, Like } from 'typeorm';
import { UInt32 } from '@bits/grpc/grpc.scalars';
import { IConnection } from '../../bits.types';

function getDefaultConnection<M>(ModelCls: Type<M>): Type<IConnection<M>> {
  @GrpcMessageDef({ name: `${ModelCls.name}Connection` })
  class GenericFindManyResponse {
    @GrpcFieldDef(() => UInt32)
    totalCount: number;

    @GrpcFieldDef(() => [ModelCls])
    nodes: M[];
  }

  return GenericFindManyResponse;
}

export type AnyConstructor<A = object> = new (...input: any[]) => A;

export function ReadableGrpcController<M, B extends AnyConstructor>(
  ModelCls: Type<M>,
  ServiceCls: Type<IReadableCrudService<M>>,
  defineService = true,
  Base: B = class {} as any,
  FindOneInputDTO?: Type,
): Type<IGrpcReadController<M> & InstanceType<B>> {
  const FindMany = getDefaultFindManyInput(ModelCls);
  const FindManyResp = getDefaultConnection(ModelCls);
  const FinalFindOneInput = FindOneInputDTO || FindByIdInput;

  @Controller()
  class ModelController extends Base implements IGrpcReadController<M> {
    @Inject(ServiceCls) private svc: IReadableCrudService<M>;

    @GrpcMethodDef({ requestType: () => FinalFindOneInput, responseType: () => ModelCls })
    async findOne(input: FindByIdInput): Promise<M> {
      return this.svc.findOne(input as any);
    }

    @GrpcMethodDef({
      requestType: () => FindMany,
      responseType: () => FindManyResp,
    })
    async findMany(input: IGrpcFindManyInput<M>): Promise<IGrpcFindManyResponse<M>> {
      const filter = this.convertExternalFilterToLocal(input.filter);
      const resp = {
        totalCount: await this.svc.count(filter),
        nodes: await this.svc.findMany(filter),
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
