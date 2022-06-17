import {
  DeepPartial,
  FindConditions,
  FindManyOptions,
  FindOneOptions,
  Repository,
  UpdateResult,
} from 'typeorm';
import { QueryDeepPartialEntity } from 'typeorm/query-builder/QueryPartialEntity';
import { IReadableRepo, IWritableRepo } from '@bits/db/repo.interface';

export interface IReadableCrudService<Entity> {
  readRepo: IReadableRepo<Entity>;
  count(filter?: FindManyOptions<Entity>): Promise<number>;
  findMany(filter?: FindManyOptions<Entity>): Promise<Entity[]>;
  findOne(
    id: string | FindOneOptions<Entity> | FindConditions<Entity>,
    options?: FindOneOptions<Entity>,
  ): Promise<Entity>;
}

export interface IWritableCrudService<Entity> {
  writeRepo: IWritableRepo<Entity>;
  createOne(newEntity: DeepPartial<Entity>): Promise<Entity>;
  deleteOne(id: string | FindConditions<Entity>): Promise<boolean>;
  updateOne(
    idOrConditions: string | FindConditions<Entity>,
    partialEntity: QueryDeepPartialEntity<Entity>,
    // ...options: any[]
  ): Promise<boolean>;
}
