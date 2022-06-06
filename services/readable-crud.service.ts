import { IReadableRepo } from '../db/repo.interface';
import { DeepPartial, FindConditions, FindManyOptions, FindOneOptions } from 'typeorm';
import { IReadableCrudService } from './interface.service';
import { Inject, Injectable, Type } from '@nestjs/common';

export const ReadableCrudService = <M>(
  Model: Type<M>,
  Repo: Type<IReadableRepo<M>>,
): Type<IReadableCrudService<M>> => {
  @Injectable()
  class ReadableCrudService implements IReadableCrudService<M> {
    @Inject(Repo) readRepo!: IReadableRepo<M>;

    count(filter?: FindManyOptions<M>): Promise<number> {
      return this.readRepo.count(filter);
    }

    createOne(newEntity: DeepPartial<M>): Promise<M> {
      return this.readRepo.create(newEntity);
    }
    findMany(filter?: FindManyOptions<M>): Promise<M[]> {
      return this.readRepo.findAll(filter);
    }
    findOne(
      id: string | FindOneOptions<M> | FindConditions<M>,
      options?: FindOneOptions<M>,
    ): Promise<M> {
      return this.readRepo.findOne(id, options);
    }
  }

  return ReadableCrudService;
};
