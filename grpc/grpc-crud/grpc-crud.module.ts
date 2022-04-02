import { DynamicModule, Inject, Injectable, Type } from '@nestjs/common';
import { IReadableRepo, IWritableRepo } from '../../db/repo.interface';
import { WritableRepo } from '../../db/writable.repo';
import { User } from '../../../../src/domain/user/user.entity';
import { ReadableRepo } from '../../db/readable.repo';
import { GrpcServiceDef } from '../decorators/service.decorator';
import { UserService } from '../../../../src/domain/user/user.service';
import { UserRepo } from '../../../../src/domain/user/user.repo';
import { GrpcMethodDef } from '../decorators/method.decorator';
import { FindOneInput } from '../../../../src/domain/user/dto/find-one.input';
import { FindManyUserInput } from '@domain/user/dto/find-many-user.input';
import { FindManyUsersResponse } from '../../../../src/domain/user/dto/find-many-users.response';
import { CreateUserInput } from '../../../../src/domain/user/dto/create-user.input';
import { UpdateUserInput } from '../../../../src/domain/user/dto/update-user.input';
import { DeleteUserInput } from '../../../../src/domain/user/dto/delete-user.input';
import { DeleteUserResponse } from '../../../../src/domain/user/dto/delete-user.response';
import {
  CreateInput,
  Filter,
  FindManyInput,
  FindManyResponse,
  IGrpcController,
  UpdateInput,
} from './grpc-controller.interface';
import { GrpcMessageDef } from '@bits/grpc/decorators/message.decorator';
import { GrpcFieldDef } from '@bits/grpc/decorators/field.decorator';
import { OffsetPagination } from '@domain/user/dto/pagination.dto';
import { UserFilter } from '@domain/user/dto/user-filter.input';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PartialType } from '@bits/grpc/mapped-types';

type R<M> = IWritableRepo<M> & IReadableRepo<M>;

export interface GrpcCrudConfig<M> {
  Model: Type<M>;
  Repo?: Type<IWritableRepo<M>>;
  Controller?: Type<IGrpcController<M>>;
  Service?: Type<any>;
}

export class GRPCCrudModule {
  static makeWritableCrud<M extends Object>({
    Model,
    Repo,
    Controller,
    Service,
  }: GrpcCrudConfig<any>): DynamicModule {
    const FinalRepo = Repo || this.getRepo(Model);
    const FinalController = Controller || this.getController(Model, FinalRepo);
    return {
      module: GRPCCrudModule,
      providers: [FinalRepo],
      controllers: [FinalController],
      imports: [TypeOrmModule.forFeature([Model])],
      exports: [FinalRepo],
    };
  }

  static getRepo<M>(Model: Type<M>): any {
    @Injectable()
    class EntityRepo extends WritableRepo(Model, ReadableRepo(Model, Object)) {}
    return EntityRepo;
  }

  static getController<M>(ModelClass: Type<M>, RepoCls: Type<R<M>>): any {
    const FindMany = this.getFindManyInput(ModelClass);
    const FindManyResp = this.getFindManyResponse(ModelClass);
    const GenericUpdate = this.getUpdateInput(ModelClass);

    @Injectable()
    @GrpcServiceDef(`${ModelClass.name}Service`)
    class ModelController {
      @Inject(RepoCls) private repo: R<M>;

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

      @GrpcMethodDef({ requestType: () => CreateUserInput, responseType: () => User })
      async createOne(newUser: CreateInput<M>): Promise<M> {
        return this.repo.repository.save(newUser as any);
      }

      @GrpcMethodDef({ requestType: () => GenericUpdate, responseType: () => User })
      async updateOne(user: UpdateInput<M>): Promise<M> {
        return this.repo.repository.save(user as any);
      }

      @GrpcMethodDef({ requestType: () => DeleteUserInput, responseType: () => DeleteUserResponse })
      async deleteOne(user: DeleteUserInput): Promise<DeleteUserResponse> {
        return { success: Boolean(await this.repo.repository.delete(user.id)) };
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
      @GrpcFieldDef(() => [User])
      nodes: User[];
    }

    return GenericFindManyResponse;
  }

  static getUpdateInput<M>(ModelCls: Type<M>): Type<UpdateInput<M>> {
    @GrpcMessageDef({ name: `Update${ModelCls.name}Input` })
    class GenericUpdateInput extends PartialType(ModelCls as Type) {}

    return GenericUpdateInput as any;
  }
}
