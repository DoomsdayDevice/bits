import { IWritableRepo } from '../db/repo.interface';
import { IWritableCrudService } from './interface.service';
import { DeepPartial, FindConditions, UpdateResult } from 'typeorm';
import { QueryDeepPartialEntity } from 'typeorm/query-builder/QueryPartialEntity';
import { Inject, Injectable, Type } from '@nestjs/common';
import { ReadableCrudService } from '@bits/services/readable-crud.service';

export function WritableCrudService<Entity, B extends Type>(
  ModelCls: Type<Entity>,
  Repo: Type<IWritableRepo<Entity>>,
  Base: B,
): Type<IWritableCrudService<Entity> & InstanceType<B>> {
  @Injectable()
  class WritableCrudService extends Base implements IWritableCrudService<Entity> {
    @Inject(Repo) writeRepo: IWritableRepo<Entity>;

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
    Promise<UpdateResult | Entity> {
      return this.writeRepo.update(idOrConditions, partialEntity);
    }
  }
  return WritableCrudService as any;
}
