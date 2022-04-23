import { Controller, Inject, Type } from '@nestjs/common';
import { FindManyInput, FindManyResponse, IGrpcReadController } from './grpc-controller.interface';
import { GrpcMethodDef } from '../decorators/method.decorator';
import { GrpcServiceDef } from '../decorators/service.decorator';
import { GrpcMessageDef } from '../decorators/message.decorator';
import { GrpcFieldDef } from '../decorators/field.decorator';
import { FindOneInput } from '../grpc.dto';
import { getDefaultFindManyInput } from '@bits/grpc/grpc-crud/dto/default-find-many-input.grpc';
import { IReadableCrudService } from '@bits/services/interface.service';
import { In } from 'typeorm';
import { UInt32 } from '@bits/grpc/grpc.scalars';

function getDefaultFindManyResponse<M>(ModelCls: Type<M>): any {
  @GrpcMessageDef({ name: `FindMany${ModelCls.name}Response` })
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
): Type<IGrpcReadController<M> & InstanceType<B>> {
  const FindMany = getDefaultFindManyInput(ModelCls);
  const FindManyResp = getDefaultFindManyResponse(ModelCls);

  @Controller()
  class ModelController extends Base implements IGrpcReadController<M> {
    @Inject(ServiceCls) private svc: IReadableCrudService<M>;

    @GrpcMethodDef({ requestType: () => FindOneInput, responseType: () => ModelCls })
    async findOne(input: FindOneInput): Promise<M> {
      return this.svc.findOne(input.id);
    }

    @GrpcMethodDef({
      requestType: () => FindMany,
      responseType: () => FindManyResp,
    })
    async findMany(input: FindManyInput<M>): Promise<FindManyResponse<M>> {
      const filter = this.convertExternalFilterToLocal(input.filter);
      const resp = {
        totalCount: await this.svc.count(filter),
        nodes: await this.svc.findMany(filter),
      };
      resp.nodes.forEach(n => {
        for (const key of Object.keys(n)) {
          if (n[key] instanceof Date) n[key] = n[key].toISOString();
        }
      });
      return resp;
    }

    convertExternalFilterToLocal(filter: any = {}): any {
      const newFilter = {};
      for (const key of Object.keys(filter)) {
        const comparisonField = filter[key];
        if (comparisonField.eq !== undefined) newFilter[key] = comparisonField.eq;
        else if (comparisonField.in) newFilter[key] = In(comparisonField.in.list);
      }
      return newFilter;
    }
  }

  if (defineService) GrpcServiceDef(`${ModelCls.name}Service`)(ModelController);
  return ModelController as any;
}
