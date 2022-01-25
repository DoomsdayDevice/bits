import { DynamicModule, Inject, Injectable, Type } from '@nestjs/common';
import { IReadableRepo, IWritableRepo } from '../../db/repo.interface';
import { WritableRepoMixin } from '../../db/writable.repo';
import { ReadableRepoMixin } from '../../db/readable.repo';
import { IGrpcWriteController } from './grpc-controller.interface';
import { TypeOrmModule } from '@nestjs/typeorm';
import { renameFunc } from '../../bits.utils';
import { WritableCrudService } from '@bits/services/writable-crud.service';
import { WritableGrpcController } from '@bits/grpc/grpc-crud/grpc.writable.controller';
import { ReadableGrpcController } from '@bits/grpc/grpc-crud/grpc.readable.controller';

type IWRRepo<M> = IWritableRepo<M> & IReadableRepo<M>;

export interface GrpcWritableCrudConfig<M> {
  Model: Type<M>;
  Repo?: Type<IWRRepo<M>>;
  Controller?: Type<IGrpcWriteController<M>>;
  Service?: Type;
  imports?: any[];
}
export interface GrpcReadableCrudConfig<M> {
  Model: Type<M>;
  Repo?: Type<IReadableRepo<M>>;
  Controller?: Type<IGrpcWriteController<M>>;
  Service?: Type;
  imports?: any[];
}

export class GRPCCrudModule {
  static makeWritableCrud<M extends Object>({
    Model,
    Repo,
    Controller,
    Service,
    imports = [],
  }: GrpcWritableCrudConfig<any>): DynamicModule {
    const FinalRepo = Repo || WritableRepoMixin(Model)();
    const FinalController = Controller || WritableGrpcController(Model, FinalRepo);
    const FinalService = Service || WritableCrudService(FinalRepo);

    return {
      module: GRPCCrudModule,
      providers: [FinalRepo, FinalController, FinalService],
      controllers: [FinalController],
      imports: [TypeOrmModule.forFeature([Model]), ...imports],
      exports: [FinalRepo],
    };
  }

  static makeReadableCrud<M extends Object>({
    Model,
    Repo,
    Controller,
    imports = [],
  }: GrpcReadableCrudConfig<any>): DynamicModule {
    const FinalRepo = Repo || ReadableRepoMixin(Model)();
    const FinalController = Controller || ReadableGrpcController(Model, FinalRepo);

    return {
      module: GRPCCrudModule,
      providers: [FinalRepo],
      controllers: [FinalController],
      imports: [TypeOrmModule.forFeature([Model]), ...imports],
      exports: [FinalRepo],
    };
  }
}
