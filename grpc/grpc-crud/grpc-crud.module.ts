import { DynamicModule, Module, Type } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WritableCrudService } from '@bits/services/writable-crud.service';
import { WritableGrpcController } from '@bits/grpc/grpc-crud/grpc.writable.controller';
import { ReadableGrpcController } from '@bits/grpc/grpc-crud/grpc.readable.controller';
import { ReadableCrudService } from '@bits/services/readable-crud.service';
import { getRepositoryToken } from '@bits/db/inject-repo.decorator';
import { renameFunc } from '@bits/bits.utils';
import { IGrpcWriteController } from '@bits/grpc';
import { ObjectLiteral } from 'typeorm';
import { IReadableRepo, IWritableRepo } from '../../db/repo.interface';
import { WritableRepoMixin } from '../../db/writable.repo';
import { ReadableRepoMixin } from '../../db/readable.repo';

type IWRRepo<M extends ObjectLiteral> = IWritableRepo<M> & IReadableRepo<M>;

export interface GrpcWritableCrudConfig<M extends ObjectLiteral> {
  Model: Type<M>;
  Repo?: Type<IWRRepo<M>>;
  Controller?: Type<IGrpcWriteController<M>>;
  Service?: Type;
  CreateDTO?: Type;
  DeleteDTO?: Type;
  imports?: any[];
  providers?: any[];
}
export interface GrpcReadableCrudConfig<M extends ObjectLiteral> {
  Model: Type<M>;
  Repo?: Type<IReadableRepo<M>>;
  Controller?: Type<IGrpcWriteController<M>>;
  FindOneDTO?: Type;
  Service?: Type;
  imports?: any[];
  providers?: any[];
  isSimple?: boolean; // no paging, sorting, filtering (for enums and such)
}

export class GRPCCrudModule {
  static makeWritableCrud<M extends ObjectLiteral>({
    Model,
    Repo,
    Controller,
    Service,
    CreateDTO,
    DeleteDTO,
    imports = [],
    providers = [],
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

    const exports: Type[] = [];
    if (!Repo) exports.push(FinalRepo);
    if (!Service) exports.push(FinalService);

    @Module({
      providers: [FinalRepo, FinalController, FinalService, ...providers],
      controllers: [FinalController],
      imports: [TypeOrmModule.forFeature([Model]), ...imports],
      exports,
    })
    class WritableModule {}

    return WritableModule as any;
  }

  static makeReadableCrud<M extends ObjectLiteral>({
    Model,
    Repo,
    Service,
    FindOneDTO,
    Controller,
    imports = [],
    providers = [],
    isSimple,
  }: GrpcReadableCrudConfig<any>): DynamicModule {
    const FinalRepo = Repo || ReadableRepoMixin(Model)();
    const FinalService = Service || ReadableCrudService(Model, FinalRepo);
    const FinalController =
      Controller ||
      ReadableGrpcController(Model, FinalService, undefined, undefined, FindOneDTO, isSimple);

    @Module({
      providers: [FinalRepo, FinalService, ...providers],
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
