import {
  DeepPartial,
  FindManyOptions,
  FindOneOptions,
  FindOptionsWhere,
  ObjectLiteral,
} from 'typeorm';
import { Inject, Injectable, Type } from '@nestjs/common';
import { IConnection } from '@bits/bits.types';
import { IFindManyServiceInput, IReadableCrudService } from './interface.service';
import { IReadableRepo } from '../db/repo.interface';

export const ReadableCrudService = <M extends ObjectLiteral, R extends IReadableRepo<M>>(
  Model: Type<M>,
  Repo: Type<R>,
): Type<IReadableCrudService<M> & { readRepo: R }> => {
  @Injectable()
  // eslint-disable-next-line no-shadow
  class ReadableCrudService implements IReadableCrudService<M> {
    @Inject(Repo) readRepo!: R;

    count(filter?: IFindManyServiceInput<M>): Promise<number> {
      return this.readRepo.count(filter);
    }

    createOne(newEntity: DeepPartial<M>): Promise<M> {
      return this.readRepo.create(newEntity);
    }

    findMany(filter: IFindManyServiceInput<M> = {}): Promise<M[]> {
      return this.readRepo.findNested(filter);
    }

    findManyAndCount(filter: IFindManyServiceInput<M> = {}): Promise<IConnection<M>> {
      return this.readRepo.findAndCount(filter);
    }

    findOne(
      id: string | FindOneOptions<M> | FindOptionsWhere<M>,
      options?: FindOneOptions<M>,
    ): Promise<M> {
      return this.readRepo.findOne(id, options);
    }

    getPrimaryColumnName(): keyof M {
      return this.readRepo.getPrimaryColumnName();
    }
  }

  return ReadableCrudService;
};
