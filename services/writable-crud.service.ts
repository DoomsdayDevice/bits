import { DeepPartial, FindOptionsWhere, ObjectLiteral } from 'typeorm';
import { QueryDeepPartialEntity } from 'typeorm/query-builder/QueryPartialEntity';
import { Inject, Injectable, Type } from '@nestjs/common';
import { IWritableRepo } from '../db/repo.interface';
import { IWritableCrudService } from './interface.service';

export function WritableCrudService<
  Entity extends ObjectLiteral,
  B extends Type,
  R extends IWritableRepo<Entity>,
>(
  ModelCls: Type<Entity>,
  Repo: Type<R>,
  Base: B,
): Type<IWritableCrudService<Entity> & InstanceType<B> & { writeRepo: R }> {
  @Injectable()
  // eslint-disable-next-line no-shadow
  class WritableCrudService extends Base implements IWritableCrudService<Entity> {
    @Inject(Repo) writeRepo!: R;

    createOne(newEntity: DeepPartial<Entity>): Promise<Entity> {
      return this.writeRepo.create(newEntity);
    }

    deleteOne(id: string): Promise<boolean> {
      return this.writeRepo.deleteOne(id);
    }

    updateOne(
      idOrConditions: string | FindOptionsWhere<Entity>,
      partialEntity: QueryDeepPartialEntity<Entity>,
    ): // ...options: any[]
    Promise<boolean> {
      return this.writeRepo.update(idOrConditions, partialEntity);
    }
  }
  return WritableCrudService as any;
}
