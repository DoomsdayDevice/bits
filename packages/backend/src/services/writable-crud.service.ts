import { Inject, Injectable, Type } from "@nestjs/common";
import { IWritableRepo } from "../repos/repo.interface";
import { IWritableCrudService } from "./types";
import { DeepPartial, ObjectLiteral } from "@bits/core";
import { IFindOptionsWhere } from "./find-options";

export function WritableCrudService<
  E extends ObjectLiteral,
  B extends Type,
  R extends IWritableRepo<E>
>(
  ModelCls: Type<E>,
  Repo: Type<R>,
  Base: B
): Type<IWritableCrudService<E> & InstanceType<B>> {
  @Injectable()
  // eslint-disable-next-line no-shadow
  class WritableCrudService extends Base implements IWritableCrudService<E> {
    @Inject(Repo) private writeRepo!: R;

    createOne(newEntity: DeepPartial<E>): Promise<E> {
      return this.writeRepo.create(newEntity);
    }

    deleteOne(id: IFindOptionsWhere<E>): Promise<boolean> {
      return this.writeRepo.deleteOne(id);
    }

    updateOne(
      idOrConditions: string | IFindOptionsWhere<E>,
      partialEntity: DeepPartial<E>
    ): // ...options: any[]
    Promise<E> {
      return this.writeRepo.update(idOrConditions, partialEntity);
    }
  }
  return WritableCrudService as any;
}