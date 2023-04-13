import { GRPCCrudModuleBuilder } from "./grpc-crud.abstract.module";
import { Class, ObjectLiteral } from "@bits/core";
import { ReadableRepoMixin } from "@bits/db";
import { ReadableGrpcController } from "./grpc.readable.controller";
import { IReadableRepo, ReadableCrudService } from "@bits/backend";
import { DynamicModule } from "@nestjs/common";
import { GrpcReadableCrudConfig } from "../types";

export class GRPCReadableCrudModuleBuilder<
  T extends ObjectLiteral
> extends GRPCCrudModuleBuilder {
  protected constructor(protected cfg: GrpcReadableCrudConfig<any>) {
    super();
  }

  protected buildRepo() {
    return this.cfg.Repo || ReadableRepoMixin(this.cfg.Model)();
  }

  protected buildService(Repo: Class<IReadableRepo<T>>) {
    return this.cfg.Service || ReadableCrudService(this.cfg.Model, Repo);
  }

  protected buildController(Service: Class<any>) {
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

  static build<M extends ObjectLiteral>(
    cfg: GrpcReadableCrudConfig<any>
  ): DynamicModule {
    const builder = new GRPCReadableCrudModuleBuilder(cfg);
    const { Model, imports = [], providers = [] } = builder.cfg;

    const Repo = builder.buildRepo();
    const Service = builder.buildService(Repo as any);
    const Controller = builder.buildController(Service);

    return builder.buildModule(
      builder.cfg.Model.name,
      Repo,
      Service,
      Controller,
      providers,
      [...builder.cfg.dataProvider.getImports(builder.cfg.Model), ...imports]
    );
  }
}
