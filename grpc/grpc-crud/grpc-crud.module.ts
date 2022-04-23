import { DynamicModule, Type } from '@nestjs/common';
import { IReadableRepo, IWritableRepo } from '../../db/repo.interface';
import { WritableRepoMixin } from '../../db/writable.repo';
import { ReadableRepoMixin } from '../../db/readable.repo';
import { IGrpcWriteController } from './grpc-controller.interface';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WritableCrudService } from '@bits/services/writable-crud.service';
import { WritableGrpcController } from '@bits/grpc/grpc-crud/grpc.writable.controller';
import { ReadableGrpcController } from '@bits/grpc/grpc-crud/grpc.readable.controller';
import { ReadableCrudService } from '@bits/services/readable-crud.service';

type IWRRepo<M> = IWritableRepo<M> & IReadableRepo<M>;

export interface GrpcWritableCrudConfig<M> {
  Model: Type<M>;
  Repo?: Type<IWRRepo<M>>;
  Controller?: Type<IGrpcWriteController<M>>;
  Service?: Type;
  CreateDTO?: Type;
  DeleteDTO?: Type;
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
    CreateDTO,
    DeleteDTO,
    imports = [],
  }: GrpcWritableCrudConfig<any>): DynamicModule {
    const FinalRepo = Repo || WritableRepoMixin(Model)(ReadableRepoMixin(Model)());
    const FinalService =
      Service || WritableCrudService(Model, FinalRepo, ReadableCrudService(Model, FinalRepo));
    const FinalController =
      Controller ||
      WritableGrpcController(
        Model,
        FinalService,
        CreateDTO,
        DeleteDTO,
        true,
        ReadableGrpcController(Model, FinalService, false),
      );

    return {
      module: GRPCCrudModule,
      providers: [FinalRepo, FinalController, FinalService],
      controllers: [FinalController],
      imports: [TypeOrmModule.forFeature([Model]), ...imports],
      exports: [FinalRepo, FinalService],
    };
  }

  static makeReadableCrud<M extends Object>({
    Model,
    Repo,
    Service,
    Controller,
    imports = [],
  }: GrpcReadableCrudConfig<any>): DynamicModule {
    const FinalRepo = Repo || ReadableRepoMixin(Model)();
    const FinalService = Service || ReadableCrudService(Model, FinalRepo);
    const FinalController = Controller || ReadableGrpcController(Model, FinalService);

    return {
      module: GRPCCrudModule,
      providers: [FinalRepo, FinalService],
      controllers: [FinalController],
      imports: [TypeOrmModule.forFeature([Model]), ...imports],
      exports: [FinalRepo, FinalService],
    };
  }
}
