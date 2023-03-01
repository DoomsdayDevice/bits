import { GRPCCrudModule } from "./grpc-crud.abstract.module";
import { Class, ObjectLiteral } from "@bits/core";
import { ReadableRepoMixin } from "@bits/db";
import { ReadableGrpcController } from "./grpc.readable.controller";
import { IReadableRepo, ReadableCrudService } from "@bits/backend";
import { DynamicModule } from "@nestjs/common";
import { GrpcReadableCrudConfig } from "../types";

export class GRPCReadableCrudModule<
  T extends ObjectLiteral
> extends GRPCCrudModule {
  constructor(protected cfg: GrpcReadableCrudConfig<any>) {
    super();
  }

  getRepo() {
    return this.cfg.Repo || ReadableRepoMixin(this.cfg.Model)();
  }

  getService(Repo: Class<IReadableRepo<T>>) {
    return this.cfg.Service || ReadableCrudService(this.cfg.Model, Repo);
  }

  getController(Service: Class<any>) {
    return (
      this.cfg.Controller ||
      ReadableGrpcController(
        this.cfg.Model,
        Service,
        undefined,
        undefined,
        this.cfg.FindOneDTO,
        this.cfg.isSimple
      )
    );
  }

  build<M extends ObjectLiteral>(): DynamicModule {
    const { Model, imports = [], providers = [] } = this.cfg;

    const Repo = this.getRepo();
    const Service = this.getService(Repo as any);
    const Controller = this.getController(Service);

    return this.getModule(
      this.cfg.Model.name,
      Repo,
      Service,
      Controller,
      providers,
      [this.cfg, ...imports]
    );
  }
}
