import { GrpcMappedReadableCrudConfig } from "../types";
import { Class, ObjectLiteral } from "@bits/core";
import { IReadableRepo } from "@bits/backend";
import { GRPCReadableCrudModule } from "./readable.module";
import { MappedReadableRepoMixin } from "@bits/db";
import { DynamicModule } from "@nestjs/common";

export class GRPCMappedReadableCrudModule<
  M extends ObjectLiteral,
  E extends ObjectLiteral
> extends GRPCReadableCrudModule<M> {
  constructor(protected mappedCfg: GrpcMappedReadableCrudConfig<M, E>) {
    super(mappedCfg);
  }

  getRepo(): Class<IReadableRepo<any>> {
    return (
      this.cfg.Repo ||
      MappedReadableRepoMixin(this.mappedCfg.Entity, this.cfg.Model)()
    );
  }

  build(): DynamicModule {
    const { Entity, providers = [], imports = [] } = this.mappedCfg;
    const Repo = this.getRepo();

    const Service = this.getService(Repo);
    const Controller = this.getController(Service);

    return this.getModule(
      this.cfg.Model.name,
      Repo,
      Service,
      Controller,
      providers,
      [...this.mappedCfg.dataProvider.getImports(this.cfg.Model), ...imports]
    );
  }
}
