import { Inject, Injectable, Type } from "@nestjs/common";
import { IFindManyServiceInput, IReadableCrudService } from "./types";
import { IConnection, ObjectLiteral } from "@bits/core";
import { IFindOneOptions, IFindOptionsWhere } from "./find-options";
import { IReadableRepo } from "../repos/repo.interface";

export const ReadableCrudService = <
  M extends ObjectLiteral,
  R extends IReadableRepo<M>
>(
  Model: Type<M>,
  Repo: Type<R>
): Type<IReadableCrudService<M>> => {
  @Injectable()
  // eslint-disable-next-line no-shadow
  class ReadableCrudService implements IReadableCrudService<M> {
    @Inject(Repo) private readRepo!: R;

    count(filter?: IFindManyServiceInput<M>): Promise<number> {
      return this.readRepo.count(filter);
    }

    findMany(filter: IFindManyServiceInput<M> = {}): Promise<M[]> {
      return this.readRepo.findMany(filter);
    }

    findManyAndCount(
      filter: IFindManyServiceInput<M> = {}
    ): Promise<IConnection<M>> {
      return this.readRepo.findManyAndCount(filter);
    }

    findOne(
      id: IFindOneOptions<M> | IFindOptionsWhere<M>,
      options?: IFindOneOptions<M>
    ): Promise<M> {
      return this.readRepo.findOne(id, options);
    }

    getPrimaryColumnName(): keyof M {
      return this.readRepo.getPrimaryColumnName();
    }
  }

  return ReadableCrudService;
};
