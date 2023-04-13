import { Class, ObjectLiteral } from "@bits/core";
import { GrpcMappedWritableCrudConfig, IWRRepo } from "../types";
import { GRPCWritableCrudModule } from "./writable.module";
import { MappedReadableRepoMixin, MappedWritableRepoMixin } from "@bits/db";
import { DynamicModule } from "@nestjs/common";

export class GRPCMappedWritableCrudModule<
  M extends ObjectLiteral,
  E extends ObjectLiteral
> extends GRPCWritableCrudModule<M> {
  constructor(protected mappedCfg: GrpcMappedWritableCrudConfig<M, E>) {
    super(mappedCfg);
  }

  getMappedRepo(): Class<IWRRepo<M>> {
    const { Entity, Model } = this.mappedCfg;
    return (this.cfg.Repo ||
      MappedWritableRepoMixin(
        Entity,
        Model
      )(MappedReadableRepoMixin(Entity, Model)())) as any;
  }

  build(): DynamicModule {
    const { Entity, providers = [], imports = [] } = this.mappedCfg;
    const Repo = this.getMappedRepo();

    const Service = this.getService(Repo);
    const Controller = this.getController(Service);

    return this.buildModule(
      this.mappedCfg.Model.name,
      Repo,
      Service,
      Controller,
      providers,
      [...this.cfg.dataProvider.getImports(Entity as any), ...imports]
    );
  }
}
