import { Controller, Inject, Injectable, Type } from '@nestjs/common';
import { GrpcServiceDef } from '../decorators/service.decorator';
import { GrpcMethodDef } from '../decorators/method.decorator';
import { FindOneInput } from '../../../../src/domain/user/dto/find-one.input';
import {
  CreateInput,
  DeleteOneInput,
  DeleteOneResponse,
  Filter,
  FindManyInput,
  FindManyResponse,
  IGrpcController,
  UpdateInput,
} from './grpc-controller.interface';
import { IWritableRepo } from '../../db/repo.interface';
import { GrpcMessageDef } from '../decorators/message.decorator';
import { GrpcFieldDef } from '../decorators/field.decorator';
import { OffsetPagination } from '../../../../src/domain/user/dto/pagination.dto';
import { OmitType, PartialType } from '../mapped-types';

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

function getDefaultFilter<M>(ModelCls: Type<M>): Type<Filter<M>> {
  @GrpcMessageDef({ name: `${ModelCls.name}Filter` })
  class GenericFilter {
    @GrpcFieldDef(() => String, { nullable: true })
    id!: string;

    @GrpcFieldDef(() => String, { nullable: true })
    username!: string;

    @GrpcFieldDef(() => String, { nullable: true })
    email!: string;
  }
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

export function GrpcController<M>(
  ModelCls: Type<M>,
  RepoCls: Type<IWritableRepo<M>>,
  defineService = true,
): Type<IGrpcController<M>> {
  const FindMany = getDefaultFindManyInput(ModelCls);
  const FindManyResp = getDefaultFindManyResponse(ModelCls);
  const GenericUpdate = getDefaultUpdateInput(ModelCls);
  const GenericCreateInput = getDefaultCreateInput(ModelCls);
  const GenericDeleteResp = getDefaultDeleteResponse(ModelCls);
  const GenericDeleteInput = getDefaultDeleteInput(ModelCls);

  @Controller()
  class ModelController implements IGrpcController<M> {
    @Inject(RepoCls) private repo: IWritableRepo<M>;

    @GrpcMethodDef({ requestType: () => FindOneInput, responseType: () => ModelCls })
    async findOne(input: FindOneInput): Promise<M> {
      return this.repo.findOne(input.id);
    }

    @GrpcMethodDef({
      requestType: () => FindMany,
      responseType: () => FindManyResp,
    })
    async findMany(input: FindManyInput<M>): Promise<FindManyResponse<M>> {
      return { nodes: await this.repo.repository.find(input.filter) };
    }

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
