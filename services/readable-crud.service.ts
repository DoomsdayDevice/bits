import { IReadableRepo } from '../db/repo.interface';
import { DeepPartial, FindManyOptions, FindOneOptions, FindOptionsWhere } from 'typeorm';
import { IReadableCrudService } from './interface.service';
import { Inject, Injectable, Type } from '@nestjs/common';
import { IConnection } from '@bits/bits.types';

export const ReadableCrudService = <M, R extends IReadableRepo<M>>(
  Model: Type<M>,
  Repo: Type<R>,
): Type<IReadableCrudService<M> & { readRepo: R }> => {
  @Injectable()
  class ReadableCrudService implements IReadableCrudService<M> {
    @Inject(Repo) readRepo!: R;

    count(filter?: FindManyOptions<M>): Promise<number> {
      return this.readRepo.count(filter);
    }

    createOne(newEntity: DeepPartial<M>): Promise<M> {
      return this.readRepo.create(newEntity);
    }
    findMany(filter?: FindManyOptions<M>): Promise<M[]> {
      return this.readRepo.findNested(filter);
    }
    findManyAndCount(filter?: FindManyOptions<M>): Promise<IConnection<M>> {
      return this.readRepo.findNestedAndCount(filter);
    }
    findOne(
      id: string | FindOneOptions<M> | FindOptionsWhere<M>,
      options?: FindOneOptions<M>,
    ): Promise<M> {
      return this.readRepo.findOne(id, options);
    }
  }

  return ReadableCrudService;
};
