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
    @Inject(Repo) private repo: IWritableRepo<Entity>;

    createOne(newEntity: DeepPartial<Entity>): Promise<Entity> {
      return this.repo.create(newEntity);
    }
    deleteOne(id: string | FindConditions<Entity>): Promise<boolean> {
      return this.repo.deleteOne(id);
    }
    updateOne(
      idOrConditions: string | FindConditions<Entity>,
      partialEntity: QueryDeepPartialEntity<Entity>,
    ): // ...options: any[]
    Promise<UpdateResult | Entity> {
      return this.repo.update(idOrConditions, partialEntity);
    }
  }
  return WritableCrudService as any;
}
