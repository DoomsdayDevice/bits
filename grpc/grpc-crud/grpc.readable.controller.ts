import { Controller, Inject, Type } from '@nestjs/common';
import {
  Filter,
  FindManyInput,
  FindManyResponse,
  IGrpcReadController,
} from './grpc-controller.interface';
import { IReadableRepo } from '../../db/repo.interface';
import { GrpcMethodDef } from '../decorators/method.decorator';
import { GrpcServiceDef } from '../decorators/service.decorator';
import { GrpcMessageDef } from '../decorators/message.decorator';
import { GrpcFieldDef } from '../decorators/field.decorator';
import { FindOneInput, OffsetPagination } from '../grpc.dto';
import { fieldReflector } from '@bits/grpc/decorators/decorators';
import { GFieldInput } from '@bits/grpc/grpc.interface';

export function getDefaultFilter<M>(ModelCls: Type<M>): Type<Filter<M>> {
  // get filterable fields TODO make a separate function to get fields and filterable fields
  const foundFields = fieldReflector.get<unknown, GFieldInput>(ModelCls as any) || [];
  const filterable = foundFields.filter(f => f.filterable);

  class GenericFilter {}
  // GrpcFieldDef({ nullable: true })(GenericFilter, 'username');

  for (const f of filterable) {
    console.log({ f });
    GrpcFieldDef(f.typeFn, { name: f.name, filterable: f.filterable, nullable: true })(
      GenericFilter.prototype,
      f.name,
    );
  }

  GrpcMessageDef({ name: `${ModelCls.name}Filter` })(GenericFilter);
  return GenericFilter as any;
}

function getDefaultFindManyResponse<M>(ModelCls: Type<M>): any {
  @GrpcMessageDef({ name: `FindMany${ModelCls.name}Response` })
  class GenericFindManyResponse {
    @GrpcFieldDef(() => [ModelCls])
    nodes: M[];
  }

  return GenericFindManyResponse;
}

function getDefaultFindManyInput<M>(ModelCls: Type<M>): Type<FindManyInput<M>> {
  const F = getDefaultFilter(ModelCls);
  @GrpcMessageDef({ name: `FindMany${ModelCls.name}Input` })
  class GenericFindManyInput {
    @GrpcFieldDef(() => OffsetPagination)
    paging: OffsetPagination;

    @GrpcFieldDef(() => F)
    filter: Filter<M>;
  }
  return GenericFindManyInput;
}
export type AnyConstructor<A = object> = new (...input: any[]) => A;

export function ReadableGrpcController<M, B extends AnyConstructor>(
  ModelCls: Type<M>,
  RepoCls: Type<IReadableRepo<M>>,
  defineService = true,
  Base: B = class {} as any,
): Type<IGrpcReadController<M> & InstanceType<B>> {
  const FindMany = getDefaultFindManyInput(ModelCls);
  const FindManyResp = getDefaultFindManyResponse(ModelCls);

  @Controller()
  class ModelController extends Base implements IGrpcReadController<M> {
    @Inject(RepoCls) private repo: IReadableRepo<M>;

    @GrpcMethodDef({ requestType: () => FindOneInput, responseType: () => ModelCls })
    async findOne(input: FindOneInput): Promise<M> {
      return this.repo.findOne(input.id);
    }

    @GrpcMethodDef({
      requestType: () => FindMany,
      responseType: () => FindManyResp,
    })
    async findMany(input: FindManyInput<M>): Promise<FindManyResponse<M>> {
      const resp = { nodes: await this.repo.readRepo.find(input.filter) };
      resp.nodes.forEach(n => {
        for (const key of Object.keys(n)) {
          if (n[key] instanceof Date) n[key] = n[key].toISOString();
        }
      });
      return resp;
    }
  }

  if (defineService) GrpcServiceDef(`${ModelCls.name}Service`)(ModelController);
  return ModelController as any;
}
