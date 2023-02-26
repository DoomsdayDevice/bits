import {
  IFindManyOptions,
  IFindOneOptions,
  IFindOptionsWhere,
} from "../services/find-options";
import { DeepPartial, ObjectLiteral } from "@bits/core";
import { IFindManyServiceInput } from "../services/types";
import { SaveOptions } from "../services/save-options";
import { DeleteResult } from "../services/delete-results";

export type OrderByInput = {
  [P in string]: "ASC" | "DESC";
};

export interface NestedFindManyOpts<T> extends IFindManyOptions<T> {
  orderBy?: OrderByInput;
  onlyTopLevel?: boolean;
}

export interface IReadableRepo<Entity extends ObjectLiteral> {
  count(filter?: IFindManyServiceInput<Entity>): Promise<number>;
  findOne(
    id: IFindOneOptions<Entity> | IFindOptionsWhere<Entity>,
    options?: IFindOneOptions<Entity>
  ): Promise<Entity>;
  findMany(filter?: IFindManyServiceInput<Entity>): Promise<Entity[]>;
  findManyWithDeleted(filter: IFindManyServiceInput<Entity>): Promise<Entity[]>;
  findManyAndCount(input: IFindManyServiceInput<Entity>): Promise<any>;

  getPrimaryColumnName(): keyof Entity;
}

export interface IWritableRepo<Entity extends ObjectLiteral> {
  create(newEntity: DeepPartial<Entity>): Promise<Entity>;
  update(
    idOrConditions: string | IFindOptionsWhere<Entity>,
    partialEntity: DeepPartial<Entity>
    // ...options: any[]
  ): Promise<Entity>;
  save<T extends DeepPartial<Entity>>(
    entityOrEntities: T | T[],
    options?: SaveOptions
  ): Promise<T | T[]>;
  deleteOne(id: IFindOptionsWhere<Entity>): Promise<boolean>;
  restoreOne(id: string): Promise<boolean>;
  hardDelete(
    criteria: string | number | IFindOptionsWhere<Entity>
    /* ...options: any[] */
  ): Promise<DeleteResult>;
}

export type IRepo<T extends ObjectLiteral> = IWritableRepo<T> &
  IReadableRepo<T>;
