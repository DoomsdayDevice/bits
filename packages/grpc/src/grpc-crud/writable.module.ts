import { ReadableRepoMixin, WritableRepoMixin } from "@bits/db";
import { Class, ObjectLiteral } from "@bits/core";
import { GrpcWritableCrudConfig } from "../types";
import { ReadableCrudService, WritableCrudService } from "@bits/backend";
import { ReadableGrpcController } from "./grpc.readable.controller";
import { WritableGrpcController } from "./grpc.writable.controller";
import { GRPCCrudModule } from "./grpc-crud.abstract.module";
import { DynamicModule } from "@nestjs/common";

export class GRPCWritableCrudModule<
  T extends ObjectLiteral
> extends GRPCCrudModule {
  constructor(protected cfg: GrpcWritableCrudConfig<T>) {
    super();
  }

  getRepo() {
    return (
      this.cfg.Repo ||
      WritableRepoMixin(this.cfg.Model)(ReadableRepoMixin(this.cfg.Model)())
    );
  }

  getService(Repo: any) {
    return (
      this.cfg.Service ||
      WritableCrudService(
        this.cfg.Model,
        Repo,
        ReadableCrudService(this.cfg.Model, Repo)
      )
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

    const exports: Class[] = [];
    if (!this.cfg.Repo) exports.push(Repo);
    if (!this.cfg.Service) exports.push(FinalService);

    return this.getModule(
      Model.name,
      Repo,
      FinalService,
      FinalController,
      providers,
      [...this.cfg.dataProvider.getImports(Model), ...imports],
      exports
    );
  }
}
