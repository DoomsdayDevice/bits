import { IReadableRepo } from '../db/repo.interface';
import { DeepPartial, FindConditions, FindManyOptions, FindOneOptions } from 'typeorm';
import { IReadableCrudService } from './interface.service';
import { Inject, Injectable, Type } from '@nestjs/common';
import { crudServiceReflector } from './crud.constants';

export const ReadableCrudService = <M>(
  Model: Type<M>,
  Repo: Type<IReadableRepo<M>>,
): Type<IReadableCrudService<M>> => {
  @Injectable()
  class ReadableCrudService implements IReadableCrudService<M> {
    @Inject(Repo) private repo!: IReadableRepo<M>;

    createOne(newEntity: DeepPartial<M>): Promise<M> {
      return this.repo.create(newEntity);
    }
    findAll(filter?: FindManyOptions<M>): Promise<M[]> {
      return this.repo.findAll(filter);
    }
    findOne(
      id: string | FindOneOptions<M> | FindConditions<M>,
      options?: FindOneOptions<M>,
    ): Promise<M> {
      return this.repo.findOne(id, options);
    }
  }

  return ReadableCrudService;
};
