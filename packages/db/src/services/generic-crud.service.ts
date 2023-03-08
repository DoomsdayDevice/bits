import { Type } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { FindOptionsWhere, ObjectLiteral, Repository } from "typeorm";
import { QueryDeepPartialEntity } from "typeorm/query-builder/QueryPartialEntity";
import {
  IFindManyServiceInput,
  IFindOneOptions,
  IFindOptionsWhere,
} from "@bits/backend";
import { convertServiceFindManyInputToTypeorm } from "../utils";
import { IConnection } from "@bits/core";

/**
 * typeorm-based simple service
 * @param TClass
 * @param DTOClass
 */
export function getGenericCrudService<T extends ObjectLiteral, DTO = T>(
  TClass: Type<T>,
  DTOClass?: Type<DTO>
): any {
  class GenericCrudService {
    // _readRepo = ReadableRepoMixin(TClass)();
    //
    // _writeRepo = WritableRepoMixin(TClass)(this._readRepo);

    @InjectRepository(TClass) writeRepo!: Repository<T>;

    @InjectRepository(TClass) readRepo!: Repository<T>;

    async findMany(input: IFindManyServiceInput<T>): Promise<T[]> {
      const nodes = await this.readRepo.find(
        convertServiceFindManyInputToTypeorm(input) as any
      );
      return nodes;
    }

    async findManyAndCount(
      input: IFindManyServiceInput<T>
    ): Promise<IConnection<T>> {
      const nodes = await this.readRepo.find(
        convertServiceFindManyInputToTypeorm(input) as any
      );
      const totalCount = await this.readRepo.count(
        convertServiceFindManyInputToTypeorm(input) as any
      );
      return { totalCount, nodes };
    }

    async findOne(
      id: string | IFindOneOptions<T> | IFindOptionsWhere<T>,
      options?: IFindOneOptions<T>
    ): Promise<T> {
      const node = await this.readRepo.findOneBy(id as any);
      if (node) return node;
      throw new Error(`${(id as any).id} not found in ${TClass.name}`);
    }

    async deleteOne(input: any): Promise<boolean> {
      await this.writeRepo.delete(input);
      return true;
    }

    async updateOne(
      idOrConditions: string | FindOptionsWhere<T>,
      partialEntity: QueryDeepPartialEntity<T>
    ): Promise<T> {
      return this.writeRepo.save({
        id: idOrConditions,
        ...partialEntity,
      } as any);
    }

    async createOne(input: any): Promise<T> {
      return this.writeRepo.save(input as T);
    }

    count(input: any) {
      return this.readRepo.count(input);
    }

    getPrimaryColumnName() {
      return "id";
    }
  }

  return GenericCrudService;
}
