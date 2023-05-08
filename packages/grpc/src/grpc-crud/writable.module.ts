import { SimpleReadableRepoMixin, SimpleWritableRepoMixin } from "@bits/db";
import { Class, ObjectLiteral } from "@bits/core";
import { GrpcWritableCrudConfig } from "../types";
import { ReadableCrudService, WritableCrudService } from "@bits/backend";
import { ReadableGrpcController } from "./grpc.readable.controller";
import { WritableGrpcController } from "./grpc.writable.controller";
import { GRPCCrudModuleBuilder } from "./grpc-crud.abstract.module";
import { DynamicModule } from "@nestjs/common";

export class GRPCWritableCrudModule<
  T extends ObjectLiteral
> extends GRPCCrudModuleBuilder {
  protected constructor(protected cfg: GrpcWritableCrudConfig<T>) {
    super();
  }

  getRepo() {
    return (
      this.cfg.Repo ||
      SimpleWritableRepoMixin(this.cfg.Model)(
        SimpleReadableRepoMixin(this.cfg.Model)()
      )
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

  static build<M extends ObjectLiteral>(
    cfg: GrpcWritableCrudConfig<M>
  ): DynamicModule {
    const newModule = new GRPCWritableCrudModule(cfg);
    const { Model, imports = [], providers = [] } = newModule.cfg;
    const Repo = newModule.getRepo();
    const FinalService = newModule.getService(Repo);

    const FinalController = newModule.getController(FinalService);

    const exports: Class[] = [];
    if (!newModule.cfg.Repo) exports.push(Repo);
    if (!newModule.cfg.Service) exports.push(FinalService);

    return newModule.buildModule(
      Model.name,
      Repo,
      FinalService,
      FinalController,
      providers,
      [...newModule.cfg.dataProvider.getImports(Model), ...imports],
      exports
    );
  }
}
