import { DynamicModule, Module, Type } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WritableCrudService } from '@bits/services/writable-crud.service';
import { WritableGrpcController } from '@bits/grpc/grpc-crud/grpc.writable.controller';
import { ReadableGrpcController } from '@bits/grpc/grpc-crud/grpc.readable.controller';
import { ReadableCrudService } from '@bits/services/readable-crud.service';
import { getRepositoryToken } from '@bits/db/inject-repo.decorator';
import { renameFunc } from '@bits/bits.utils';
import { IGrpcWriteController } from '@bits/grpc';
import { MappedReadableRepoMixin } from '@bits/db/mapped-readable.repo';
import { MappedWritableRepoMixin } from '@bits/db/mapped-writable.repo';
import { ObjectLiteral } from 'typeorm';
import { IReadableRepo, IWritableRepo } from '../../../backend/src/repos/repo.interface';
import { WritableRepoMixin } from '../../../db/src/writable.repo';
import { ReadableRepoMixin } from '../../../db/src/readable.repo';

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

export interface GrpcMappedReadableCrudConfig<M extends ObjectLiteral, E extends ObjectLiteral>
  extends GrpcReadableCrudConfig<M> {
  Entity: Type<E>;
}
export interface GrpcMappedWritableCrudConfig<M extends ObjectLiteral, E extends ObjectLiteral>
  extends GrpcWritableCrudConfig<M> {
  Entity: Type<E>;
}

export class GRPCCrudModuleBuilder {
  static makeAndProvideRepo(Model: Type, write: boolean = true): DynamicModule {
    const Repo = write
      ? WritableRepoMixin(Model)(ReadableRepoMixin(Model)())
      : ReadableRepoMixin(Model)();

    renameFunc(Repo, `${Model.name}Repo`);

    const token = getRepositoryToken(Model);

    return {
      global: true,
      module: GRPCCrudModuleBuilder,
      imports: [TypeOrmModule.forFeature([Model])],
      providers: [{ provide: token, useClass: Repo }],
      exports: [token],
    };
  }
}

abstract class GRPCCrudModule {
  getModule(
    name: string,
    Repo: any,
    Service: any,
    Controller: any,
    providers: any[],
    imports: any[],
    exports?: any[],
  ) {
    @Module({
      providers: [Repo, Service, ...providers],
      controllers: [Controller],
      imports,
      exports: exports || [Repo, Service],
    })
    class GrpcCrudModule {}
    renameFunc(GrpcCrudModule, `GrpcCrud${name}Module`);

    return GrpcCrudModule as any;
  }
}

export class GRPCWritableCrudModule<T extends ObjectLiteral> extends GRPCCrudModule {
  constructor(protected cfg: GrpcWritableCrudConfig<T>) {
    super();
  }

  getRepo() {
    return this.cfg.Repo || WritableRepoMixin(this.cfg.Model)(ReadableRepoMixin(this.cfg.Model)());
  }

  getService(Repo: any) {
    return (
      this.cfg.Service ||
      WritableCrudService(this.cfg.Model, Repo, ReadableCrudService(this.cfg.Model, Repo))
    );
  }

  getController(Service: any) {
    const { CreateDTO, DeleteDTO, Model } = this.cfg;
    return (
      this.cfg.Controller ||
      WritableGrpcController({
        WriteModelCls: Model,
        ServiceCls: Service,
        CreateDTO,
        DeleteDTO,
        defineService: true,
        Base: ReadableGrpcController(Model, Service, false),
      })
    );
  }

  build<M extends ObjectLiteral>(): DynamicModule {
    const { Model, imports = [], providers = [] } = this.cfg;
    const Repo = this.getRepo();
    const FinalService = this.getService(Repo);

    const FinalController = this.getController(FinalService);

    const exports: Type[] = [];
    if (!this.cfg.Repo) exports.push(Repo);
    if (!this.cfg.Service) exports.push(FinalService);

    return this.getModule(
      Model.name,
      Repo,
      FinalService,
      FinalController,
      providers,
      [TypeOrmModule.forFeature([Model]), ...imports],
      exports,
    );
  }
}

export class GRPCReadableCrudModule<T extends ObjectLiteral> extends GRPCCrudModule {
  constructor(protected cfg: GrpcReadableCrudConfig<any>) {
    super();
  }

  getRepo() {
    return this.cfg.Repo || ReadableRepoMixin(this.cfg.Model)();
  }

  getService(Repo: Type<IReadableRepo<T>>) {
    return this.cfg.Service || ReadableCrudService(this.cfg.Model, Repo);
  }

  getController(Service: Type<any>) {
    return (
      this.cfg.Controller ||
      ReadableGrpcController(
        this.cfg.Model,
        Service,
        undefined,
        undefined,
        this.cfg.FindOneDTO,
        this.cfg.isSimple,
      )
    );
  }

  build<M extends ObjectLiteral>(): DynamicModule {
    const { Model, imports = [], providers = [] } = this.cfg;

    const Repo = this.getRepo();
    const Service = this.getService(Repo as any);
    const Controller = this.getController(Service);

    return this.getModule(this.cfg.Model.name, Repo, Service, Controller, providers, [
      TypeOrmModule.forFeature([Model]),
      ...imports,
    ]);
  }
}

export class GRPCMappedWritableCrudModule<
  M extends ObjectLiteral,
  E extends ObjectLiteral,
> extends GRPCWritableCrudModule<M> {
  constructor(protected mappedCfg: GrpcMappedWritableCrudConfig<M, E>) {
    super(mappedCfg);
  }

  getMappedRepo(): Type<IWRRepo<M>> {
    const { Entity, Model } = this.mappedCfg;
    return (this.cfg.Repo ||
      MappedWritableRepoMixin(Entity, Model)(MappedReadableRepoMixin(Entity, Model)())) as any;
  }

  build(): DynamicModule {
    const { Entity, providers = [], imports = [] } = this.mappedCfg;
    const Repo = this.getMappedRepo();

    const Service = this.getService(Repo);
    const Controller = this.getController(Service);

    return this.getModule(this.mappedCfg.Model.name, Repo, Service, Controller, providers, [
      TypeOrmModule.forFeature([Entity]),
      ...imports,
    ]);
  }
}

export class GRPCMappedReadableCrudModule<
  M extends ObjectLiteral,
  E extends ObjectLiteral,
> extends GRPCReadableCrudModule<M> {
  constructor(protected mappedCfg: GrpcMappedReadableCrudConfig<M, E>) {
    super(mappedCfg);
  }

  getRepo(): Type<IReadableRepo<any>> {
    return this.cfg.Repo || MappedReadableRepoMixin(this.mappedCfg.Entity, this.cfg.Model)();
  }

  build(): DynamicModule {
    const { Entity, providers = [], imports = [] } = this.mappedCfg;
    const Repo = this.getRepo();

    const Service = this.getService(Repo);
    const Controller = this.getController(Service);

    return this.getModule(this.cfg.Model.name, Repo, Service, Controller, providers, [
      TypeOrmModule.forFeature([Entity]),
      ...imports,
    ]);
  }
}
