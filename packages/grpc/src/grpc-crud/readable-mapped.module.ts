import { GrpcMappedReadableCrudConfig } from "../types";
import { Class, ObjectLiteral } from "@bits/core";
import { IReadableRepo } from "@bits/backend";
import { GRPCReadableCrudModuleBuilder } from "./readable.module";
import { MappedReadableRepoMixin } from "@bits/db";
import { DynamicModule } from "@nestjs/common";

export class GRPCMappedReadableCrudModule<
  M extends ObjectLiteral,
  E extends ObjectLiteral
> extends GRPCReadableCrudModuleBuilder<M> {
  constructor(protected mappedCfg: GrpcMappedReadableCrudConfig<M, E>) {
    super(mappedCfg);
  }

  buildRepo(): Class<IReadableRepo<any>> {
    return (
      this.cfg.Repo ||
      MappedReadableRepoMixin(this.mappedCfg.Entity, this.cfg.Model)()
    );
  }

  build(): DynamicModule {
    const { Entity, providers = [], imports = [] } = this.mappedCfg;
    const Repo = this.buildRepo();

    const Service = this.buildService(Repo);
    const Controller = this.buildController(Service);

    return this.buildModule(
      this.cfg.Model.name,
      Repo,
      Service,
      Controller,
      providers,
      [...this.mappedCfg.dataProvider.getImports(this.cfg.Model), ...imports]
    );
  }
}
