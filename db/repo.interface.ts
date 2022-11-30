import {
  DeepPartial,
  DeleteResult,
  FindManyOptions,
  FindOneOptions,
  FindOptionsWhere,
  ObjectLiteral,
  Repository,
} from 'typeorm';
import { QueryDeepPartialEntity } from 'typeorm/query-builder/QueryPartialEntity';
import { SaveOptions } from 'typeorm/repository/SaveOptions';

export type OrderByInput = {
  [P in string]: 'ASC' | 'DESC';
};

export interface NestedFindManyOpts<T> extends FindManyOptions<T> {
  orderBy?: OrderByInput;
  onlyTopLevel?: boolean;
}

export interface IReadableRepo<Entity extends ObjectLiteral> {
  readRepo: Repository<Entity>;

  count(filter?: FindManyOptions<Entity>): Promise<number>;
  create(newEntity: DeepPartial<Entity>): Promise<Entity>;
  findAll(filter?: FindManyOptions<Entity>): Promise<Entity[]>;
  findAllWithDeleted(filter: FindManyOptions<Entity>): Promise<Entity[]>;
  findOne(
    id: string | FindOneOptions<Entity> | FindOptionsWhere<Entity>,
    options?: FindOneOptions<Entity>,
  ): Promise<Entity> | undefined;
  findNested({
    relations,
    where,
    take,
    skip,
    orderBy,
  }: NestedFindManyOpts<Entity>): Promise<Entity[]>;
  findAndCount({ relations, where, take, skip, orderBy }: NestedFindManyOpts<Entity>): Promise<any>;

  getPrimaryColumnName(): keyof Entity;
}

export interface IWritableRepo<Entity extends ObjectLiteral> {
  writeRepo: Repository<Entity>;

  create(newEntity: DeepPartial<Entity>): Promise<Entity>;
  update(
    idOrConditions: string | FindOptionsWhere<Entity>,
    partialEntity: QueryDeepPartialEntity<Entity>,
    // ...options: any[]
  ): Promise<boolean>;
  save<T extends DeepPartial<Entity>>(
    entityOrEntities: T | T[],
    options?: SaveOptions,
  ): Promise<T | T[]>;
  deleteOne(id: string | FindOptionsWhere<Entity>): Promise<boolean>;
  restoreOne(id: string): Promise<boolean>;
  hardDelete(
    criteria: string | number | FindOptionsWhere<Entity>,
    /* ...options: any[] */
  ): Promise<DeleteResult>;
}

export type IRepo<T extends ObjectLiteral> = IWritableRepo<T> & IReadableRepo<T>;
