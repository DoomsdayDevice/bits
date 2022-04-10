import { DynamicModule, Inject, Injectable, Type } from '@nestjs/common';
import { IReadableRepo, IWritableRepo } from '../../db/repo.interface';
import { WritableRepoMixin } from '../../db/writable.repo';
import { ReadableRepoMixin } from '../../db/readable.repo';
import { IGrpcController } from './grpc-controller.interface';
import { TypeOrmModule } from '@nestjs/typeorm';
import { renameFunc } from '../../bits.utils';
import { WritableCrudService } from '@bits/services/writable-crud.service';
import { GrpcController } from '@bits/grpc/grpc-crud/grpc.controller';

type IWRRepo<M> = IWritableRepo<M> & IReadableRepo<M>;

export interface GrpcWritableCrudConfig<M> {
  Model: Type<M>;
  Repo?: Type<IWRRepo<M>>;
  Controller?: Type<IGrpcController<M>>;
  Service?: Type;
  imports?: any[];
}
export interface GrpcReadableCrudConfig<M> {
  Model: Type<M>;
  Repo?: Type<IReadableRepo<M>>;
  Controller?: Type<IGrpcController<M>>;
  Service?: Type;
}

export class GRPCCrudModule {
  static makeWritableCrud<M extends Object>({
    Model,
    Repo,
    Controller,
    Service,
    imports,
  }: GrpcWritableCrudConfig<any>): DynamicModule {
    const FinalRepo = Repo || WritableRepoMixin(Model)();
    const FinalController = Controller || GrpcController(Model, FinalRepo);
    const FinalService = Service || WritableCrudService(FinalRepo);

    return {
      module: GRPCCrudModule,
      providers: [FinalRepo, Service, FinalController, FinalService],
      controllers: [FinalController],
      imports: [TypeOrmModule.forFeature([Model]), ...imports],
      exports: [FinalRepo],
    };
  }

  static makeReadableCrud<M extends Object>({
    Model,
    Repo,
    Controller,
  }: GrpcReadableCrudConfig<any>): DynamicModule {
    const FinalRepo = Repo || this.getReadableRepo(Model);
    const FinalController = Controller || GrpcController(Model, FinalRepo);
    return {
      module: GRPCCrudModule,
      providers: [FinalRepo],
      controllers: [FinalController],
      imports: [TypeOrmModule.forFeature([Model])],
      exports: [FinalRepo],
    };
  }

  static getReadableRepo<M>(Model: Type<M>): any {
    class EntityRepo extends ReadableRepoMixin(Model)() {}

    const repoName = `${Model.name}Repo`;
    renameFunc(EntityRepo, repoName);
    return EntityRepo;
  }
}
