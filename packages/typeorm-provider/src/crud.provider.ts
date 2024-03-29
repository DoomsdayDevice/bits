import { Class, ObjectLiteral, renameFunc } from "@bits/core";
import {
  ICrudModuleProvider,
  ICrudService,
  IReadableRepo,
  IWritableRepo,
  ReadableCrudService,
  WritableCrudService,
} from "@bits/backend";
import { TypeOrmModule } from "@nestjs/typeorm";
import { SimpleReadableRepoMixin, SimpleWritableRepoMixin } from "@bits/db";
import {
  DynamicModule,
  ForwardReference,
  Global,
  Module,
} from "@nestjs/common";

type Cfg<M extends ObjectLiteral> = {
  Model: Class<M>;
};

export class TypeormProvider<M extends ObjectLiteral>
  implements ICrudModuleProvider<M>
{
  ReadRepo: Class<IReadableRepo<M>>;
  WriteRepo: Class<IWritableRepo<M>>;

  constructor(private cfg: Cfg<M>) {
    this.ReadRepo = SimpleReadableRepoMixin(this.cfg.Model)();
    this.WriteRepo = SimpleWritableRepoMixin(this.cfg.Model)();
  }

  getImports(
    modelRef: Class<M>
  ): Array<
    Class<any> | DynamicModule | Promise<DynamicModule> | ForwardReference
  > {
    @Module({
      providers: [this.ReadRepo, this.WriteRepo],
      exports: [this.ReadRepo, this.WriteRepo],
      imports: [TypeOrmModule.forFeature([modelRef, this.cfg.Model])],
    })
    @Global()
    class ProviderModule {}

    renameFunc(ProviderModule, `${modelRef.name}ProviderModule`);

    return [
      TypeOrmModule.forFeature([modelRef, this.cfg.Model]),
      ProviderModule,
    ];
  }

  buildService(): Class<ICrudService<M>> {
    return WritableCrudService(
      this.cfg.Model,
      this.WriteRepo,
      ReadableCrudService(this.cfg.Model, this.ReadRepo)
    );
  }

  buildModelFromName(
    name: string,
    innerName?: string,
    type?: "input" | "object"
  ): Class<M> {
    throw new Error("build model from name not implemented for typeorm");
  }
}
