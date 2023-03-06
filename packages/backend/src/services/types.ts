import { DeepPartial, ObjectLiteral } from "@bits/core";
import { IFindManyOptions, IFindOptionsWhere } from "./find-options";
import { IReadableRepo, IWritableRepo } from "../repos";

export type IServiceWhere<T> = IFindOptionsWhere<T> & {
  AND?: IServiceWhere<T>[];
  OR?: IServiceWhere<T>[];
};

export interface IFindManyServiceInput<T>
  extends Omit<IFindManyOptions, "where"> {
  where?: IServiceWhere<T>;
}

export interface IReadableCrudService<Entity extends ObjectLiteral>
  extends Pick<
    IReadableRepo<Entity>,
    | "count"
    | "findOne"
    | "findMany"
    | "findManyAndCount"
    | "getPrimaryColumnName"
  > {
  _readRepo: IReadableRepo<Entity>;
}

export interface IWritableCrudService<Entity extends ObjectLiteral> {
  _writeRepo: IWritableRepo<Entity>;
  createOne(newEntity: DeepPartial<Entity>): Promise<Entity>;

  deleteOne(id: IFindOptionsWhere<Entity>): Promise<boolean>;

  updateOne(
    idOrConditions: string | IFindOptionsWhere<Entity>,
    partialEntity: DeepPartial<Entity>
    // ...options: any[]
  ): Promise<Entity>;
}

export type ICrudService<Entity extends ObjectLiteral> =
  IWritableCrudService<Entity> & IReadableCrudService<Entity>;
