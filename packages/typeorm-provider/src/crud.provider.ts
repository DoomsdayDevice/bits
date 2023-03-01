import { Class, ObjectLiteral } from "@bits/core";
import { ICrudModuleProvider, ICrudService } from "@bits/backend";
import { getGenericCrudService } from "@bits/db";
import { TypeOrmModule } from "@nestjs/typeorm";

type Cfg<M extends ObjectLiteral> = {
  Model: Class<M>;
};

export class TypeormProvider<M extends ObjectLiteral>
  implements ICrudModuleProvider<M>
{
  constructor(private cfg: Cfg<M>) {}

  getImports(modelRef: Class<M>) {
    return [TypeOrmModule.forFeature([modelRef])];
  }

  buildService(): Class<ICrudService<M>> {
    return getGenericCrudService(this.cfg.Model);
  }

  buildModelFromName(
    name: string,
    innerName?: string,
    type?: "input" | "object"
  ): Class<M> {
    throw new Error("not implemented for typeorm");
  }
}
