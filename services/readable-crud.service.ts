import { IReadableRepo } from '../db/repo.interface';
import { DeepPartial, FindConditions, FindManyOptions, FindOneOptions } from 'typeorm';
import { IReadableCrudService } from './interface.service';
import { Inject, Injectable, Type } from '@nestjs/common';

export const ReadableCrudService = <Entity>(
  Repo: Type<IReadableRepo<Entity>>,
): Type<IReadableCrudService<Entity>> => {
  @Injectable()
  class ReadableCrudService implements IReadableCrudService<Entity> {
    @Inject(Repo) private repo: IReadableRepo<Entity>;

    createOne(newEntity: DeepPartial<Entity>): Promise<Entity> {
      return this.repo.create(newEntity);
    }
    findAll(filter?: FindManyOptions<Entity>): Promise<Entity[]> {
      return this.repo.findAll(filter);
    }
    findOne(
      id: string | FindOneOptions<Entity> | FindConditions<Entity>,
      options?: FindOneOptions<Entity>,
    ): Promise<Entity> {
      return this.repo.findOne(id, options);
    }
  }

  return ReadableCrudService;
};
