import { IWritableRepo } from '../db/repo.interface';
import { IWritableCrudService } from './interface.service';
import { DeepPartial, FindConditions } from 'typeorm';
import { QueryDeepPartialEntity } from 'typeorm/query-builder/QueryPartialEntity';
import { Inject, Injectable, Type } from '@nestjs/common';

export function WritableCrudService<Entity, B extends Type, R extends IWritableRepo<Entity>>(
  ModelCls: Type<Entity>,
  Repo: Type<R>,
  Base: B,
): Type<IWritableCrudService<Entity> & InstanceType<B> & { writeRepo: R }> {
  @Injectable()
  class WritableCrudService extends Base implements IWritableCrudService<Entity> {
    @Inject(Repo) writeRepo: R;

    createOne(newEntity: DeepPartial<Entity>): Promise<Entity> {
      return this.writeRepo.create(newEntity);
    }
    deleteOne(id: string): Promise<boolean> {
      return this.writeRepo.deleteOne(id);
    }
    updateOne(
      idOrConditions: string | FindConditions<Entity>,
      partialEntity: QueryDeepPartialEntity<Entity>,
    ): // ...options: any[]
    Promise<boolean> {
      return this.writeRepo.update(idOrConditions, partialEntity);
    }
  }
  return WritableCrudService as any;
}
