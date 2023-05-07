import { Inject, Injectable, Type } from "@nestjs/common";
import { IFindManyServiceInput, IReadableCrudService } from "./types";
import { IConnection, ObjectLiteral, renameFunc } from "@bits/core";
import { IFindOneOptions, IFindOptionsWhere } from "./find-options";
import { IReadableRepo } from "../repos";

export const ReadableCrudService = <
  M extends ObjectLiteral,
  R extends IReadableRepo<M>
>(
  ModelRef: Type<M>,
  Repo: Type<R>
): Type<IReadableCrudService<M>> => {
  @Injectable()
  // eslint-disable-next-line no-shadow
  class ReadableCrudService implements IReadableCrudService<M> {
    @Inject(Repo) _readRepo!: R;

    count(input?: IFindManyServiceInput<M>): Promise<number> {
      return this._readRepo.count(input);
    }

    findMany(input: IFindManyServiceInput<M> = {}): Promise<M[]> {
      return this._readRepo.findMany(input);
    }

    findManyAndCount(
      input: IFindManyServiceInput<M> = {}
    ): Promise<IConnection<M>> {
      return this._readRepo.findManyAndCount(input);
    }

    findOne(
      id: IFindOneOptions<M> | IFindOptionsWhere<M>,
      options?: IFindOneOptions<M>
    ): Promise<M> {
      return this._readRepo.findOne(id, options);
    }

    getPrimaryColumnName(): keyof M {
      return this._readRepo.getPrimaryColumnName();
    }
  }

  renameFunc(ReadableCrudService, `Readable${ModelRef.name}CrudService`);
  return ReadableCrudService;
};
