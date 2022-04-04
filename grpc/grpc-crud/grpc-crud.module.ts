import { DynamicModule, Inject, Injectable, Type } from '@nestjs/common';
import { IReadableRepo, IWritableRepo } from '../../db/repo.interface';
import { WritableRepo } from '../../db/writable.repo';
import { ReadableRepo } from '../../db/readable.repo';
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
import { GrpcMessageDef } from '@bits/grpc/decorators/message.decorator';
import { GrpcFieldDef } from '@bits/grpc/decorators/field.decorator';
import { OffsetPagination } from '@domain/user/dto/pagination.dto';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OmitType, PartialType } from '@bits/grpc/mapped-types';
import { renameFunc } from '../../bits.utils';

type IWRRepo<M> = IWritableRepo<M> & IReadableRepo<M>;

export interface GrpcWritableCrudConfig<M> {
  Model: Type<M>;
  Repo?: Type<IWRRepo<M>>;
  Controller?: Type<IGrpcController<M>>;
  Service?: Type<any>;
}
export interface GrpcReadableCrudConfig<M> {
  Model: Type<M>;
  Repo?: Type<IReadableRepo<M>>;
  Controller?: Type<IGrpcController<M>>;
  Service?: Type<any>;
}

export class GRPCCrudModule {
  static makeWritableCrud<M extends Object>({
    Model,
    Repo,
    Controller,
    Service,
  }: GrpcWritableCrudConfig<any>): DynamicModule {
    const FinalRepo = Repo || this.getWRRepo(Model);
    const FinalController = Controller || this.getController(Model, FinalRepo);
    return {
      module: GRPCCrudModule,
      providers: [FinalRepo],
      controllers: [FinalController],
      imports: [TypeOrmModule.forFeature([Model])],
      exports: [FinalRepo],
    };
  }

  static makeReadableCrud<M extends Object>({
    Model,
    Repo,
    Controller,
    Service,
  }: GrpcReadableCrudConfig<any>): DynamicModule {
    const FinalRepo = Repo || this.getReadableRepo(Model);
    const FinalController = Controller || this.getController(Model, FinalRepo);
    return {
      module: GRPCCrudModule,
      providers: [FinalRepo],
      controllers: [FinalController],
      imports: [TypeOrmModule.forFeature([Model])],
      exports: [FinalRepo],
    };
  }

  static getReadableRepo<M>(Model: Type<M>): any {
    @Injectable()
    class EntityRepo extends ReadableRepo(Model, Object) {}

    const repoName = `${Model.name}Repo`;
    renameFunc(EntityRepo, repoName);

    return EntityRepo;
  }

  static getWRRepo<M>(Model: Type<M>): any {
    @Injectable()
    class EntityRepo extends WritableRepo(Model, ReadableRepo(Model, Object)) {}
    return EntityRepo;
  }

  static getController<M>(ModelClass: Type<M>, RepoCls: Type<IWRRepo<M>>): any {
    const FindMany = this.getFindManyInput(ModelClass);
    const FindManyResp = this.getFindManyResponse(ModelClass);
    const GenericUpdate = this.getUpdateInput(ModelClass);
    const GenericCreateInput = this.getCreateInput(ModelClass);
    const GenericDeleteResp = this.getDeleteResponse(ModelClass);
    const GenericDeleteInput = this.getDeleteInput(ModelClass);

    @Injectable()
    @GrpcServiceDef(`${ModelClass.name}Service`)
    class ModelController {
      @Inject(RepoCls) private repo: IWRRepo<M>;

      @GrpcMethodDef({ requestType: () => FindOneInput, responseType: () => ModelClass })
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

      @GrpcMethodDef({ requestType: () => GenericCreateInput, responseType: () => ModelClass })
      async createOne(newEntity: CreateInput<M>): Promise<M> {
        return this.repo.repository.save(newEntity as any);
      }

      @GrpcMethodDef({ requestType: () => GenericUpdate, responseType: () => ModelClass })
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
    return ModelController;
  }

  static getFindManyInput<M>(ModelCls: Type<M>): Type<FindManyInput<M>> {
    const F = this.getFilter(ModelCls);
    @GrpcMessageDef({ name: `FindMany${ModelCls.name}Input` })
    class GenericFindManyInput {
      @GrpcFieldDef(() => OffsetPagination)
      paging: OffsetPagination;

      @GrpcFieldDef(() => F)
      filter: Filter<M>;
    }
    return GenericFindManyInput;
  }

  static getFilter<M>(ModelCls: Type<M>): Type<Filter<M>> {
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

  static getFindManyResponse<M>(ModelCls: Type<M>): any {
    @GrpcMessageDef({ name: `FindMany${ModelCls.name}Response` })
    class GenericFindManyResponse {
      @GrpcFieldDef(() => [ModelCls])
      nodes: M[];
    }

    return GenericFindManyResponse;
  }

  static getUpdateInput<M>(ModelCls: Type<M>): Type<UpdateInput<M>> {
    @GrpcMessageDef({ name: `Update${ModelCls.name}Input` })
    class GenericUpdateInput extends PartialType(ModelCls as Type) {}

    return GenericUpdateInput as any;
  }

  static getDeleteInput<M>(ModelCls: Type<M>): Type<DeleteOneInput> {
    @GrpcMessageDef({ name: `Delete${ModelCls.name}Input` })
    class GenericDeleteInput {
      @GrpcFieldDef(() => String)
      id: string;
    }
    return GenericDeleteInput;
  }

  static getDeleteResponse<M>(ModelCls: Type<M>): Type<DeleteOneResponse> {
    @GrpcMessageDef({ name: `Delete${ModelCls.name}Response` })
    class GenericDeleteResponse {
      @GrpcFieldDef(() => Boolean)
      success: boolean;
    }
    return GenericDeleteResponse;
  }

  static getCreateInput<M>(ModelCls: Type<M>): Type<CreateInput<M>> {
    @GrpcMessageDef({ name: `Create${ModelCls.name}Input` })
    class GenericCreateInput extends (OmitType(ModelCls, ['createdAt', 'id'] as const) as Type) {}

    return GenericCreateInput as any;
  }
}
