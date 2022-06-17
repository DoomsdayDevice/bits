import {
  DeepPartial,
  DeleteResult,
  FindConditions,
  FindManyOptions,
  FindOneOptions,
  Repository,
  UpdateResult,
} from 'typeorm';
import { QueryDeepPartialEntity } from 'typeorm/query-builder/QueryPartialEntity';
import { SaveOptions } from 'typeorm/repository/SaveOptions';

export interface OrderByInput {
  direction: 'ASC' | 'DESC';
  fieldPath: string;
}

export interface NestedFindManyOpts<T> extends FindManyOptions<T> {
  orderBy?: OrderByInput;
}

export interface IReadableRepo<Entity> {
  readRepo: Repository<Entity>;

  count(filter?: FindManyOptions<Entity>): Promise<number>;
  create(newEntity: DeepPartial<Entity>): Promise<Entity>;
  findAll(filter?: FindManyOptions<Entity>): Promise<Entity[]>;
  findAllWithDeleted(filter: FindManyOptions<Entity>): Promise<Entity[]>;
  findOne(
    id: string | FindOneOptions<Entity> | FindConditions<Entity>,
    options?: FindOneOptions<Entity>,
  ): Promise<Entity> | undefined;
  findNested({
    relations,
    where,
    take,
    skip,
    orderBy,
  }: NestedFindManyOpts<Entity>): Promise<Entity[]>;
  findNestedAndCount({
    relations,
    where,
    take,
    skip,
    orderBy,
  }: NestedFindManyOpts<Entity>): Promise<any>;
}

export interface IWritableRepo<Entity> {
  writeRepo: Repository<Entity>;

  create(newEntity: DeepPartial<Entity>): Promise<Entity>;
  update(
    idOrConditions: string | FindConditions<Entity>,
    partialEntity: QueryDeepPartialEntity<Entity>,
    // ...options: any[]
  ): Promise<boolean>;
  save<T extends DeepPartial<Entity>>(
    entityOrEntities: T | T[],
    options?: SaveOptions,
  ): Promise<T | T[]>;
  deleteOne(id: string | FindConditions<Entity>): Promise<boolean>;
  restoreOne(id: string): Promise<boolean>;
  hardDelete(
    criteria: string | number | FindConditions<Entity>,
    /* ...options: any[] */
  ): Promise<DeleteResult>;
}

export type IRepo<T> = IWritableRepo<T> & IReadableRepo<T>;
