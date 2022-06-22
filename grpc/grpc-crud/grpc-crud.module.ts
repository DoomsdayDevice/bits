import { DynamicModule, Module, Type } from '@nestjs/common';
import { IReadableRepo, IWritableRepo } from '../../db/repo.interface';
import { WritableRepoMixin } from '../../db/writable.repo';
import { ReadableRepoMixin } from '../../db/readable.repo';
import { IGrpcWriteController } from './grpc-controller.interface';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WritableCrudService } from '@bits/services/writable-crud.service';
import { WritableGrpcController } from '@bits/grpc/grpc-crud/grpc.writable.controller';
import { ReadableGrpcController } from '@bits/grpc/grpc-crud/grpc.readable.controller';
import { ReadableCrudService } from '@bits/services/readable-crud.service';
import { getRepositoryToken } from '@bits/db/inject-repo.decorator';
import { renameFunc } from '@bits/bits.utils';

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
  FindOneDTO?: Type;
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
      WritableGrpcController({
        WriteModelCls: Model,
        ServiceCls: FinalService,
        CreateDTO,
        DeleteDTO,
        defineService: true,
        Base: ReadableGrpcController(Model, FinalService, false),
      });

    const exports = [];
    if (!Repo) exports.push(FinalRepo);
    if (!Service) exports.push(FinalService);

    @Module({
      providers: [FinalRepo, FinalController, FinalService],
      controllers: [FinalController],
      imports: [TypeOrmModule.forFeature([Model]), ...imports],
      exports,
    })
    class WritableModule {}

    return WritableModule as any;
  }

  static makeReadableCrud<M extends Object>({
    Model,
    Repo,
    Service,
    FindOneDTO,
    Controller,
    imports = [],
  }: GrpcReadableCrudConfig<any>): DynamicModule {
    const FinalRepo = Repo || ReadableRepoMixin(Model)();
    const FinalService = Service || ReadableCrudService(Model, FinalRepo);
    const FinalController =
      Controller || ReadableGrpcController(Model, FinalService, undefined, undefined, FindOneDTO);

    @Module({
      providers: [FinalRepo, FinalService],
      controllers: [FinalController],
      imports: [TypeOrmModule.forFeature([Model]), ...imports],
      exports: [FinalRepo, FinalService],
    })
    class ReadableModule {}

    return ReadableModule as any;
  }

  static makeAndProvideRepo(Model: Type, write: boolean = true): DynamicModule {
    const Repo = write
      ? WritableRepoMixin(Model)(ReadableRepoMixin(Model)())
      : ReadableRepoMixin(Model)();

    renameFunc(Repo, `${Model.name}Repo`);

    const token = getRepositoryToken(Model);

    return {
      global: true,
      module: GRPCCrudModule,
      imports: [TypeOrmModule.forFeature([Model])],
      providers: [{ provide: token, useClass: Repo }],
      exports: [token],
    };
  }
}
