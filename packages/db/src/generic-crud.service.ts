import { Type } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import {
  FindOneOptions,
  FindOptionsWhere,
  ObjectLiteral,
  Repository,
} from "typeorm";
import {
  ICrudService,
  IFindManyServiceInput,
} from "@bits/services/interface.service";
import { QueryDeepPartialEntity } from "typeorm/query-builder/QueryPartialEntity";
import { IConnection } from "@bits/bits.types";
import { convertServiceFindManyInputToTypeorm } from "@bits/utils/conversions";

export function getGenericCrudService<T extends ObjectLiteral, DTO = T>(
  TClass: Type<T>,
  DTOClass?: Type<DTO>
): Type<ICrudService<T>> {
  class GenericCrudService implements ICrudService<T> {
    @InjectRepository(TClass) writeRepo!: Repository<T>;

    @InjectRepository(TClass) readRepo!: Repository<T>;

    async findMany(input: IFindManyServiceInput<T>): Promise<T[]> {
      const nodes = await this.readRepo.find(
        convertServiceFindManyInputToTypeorm(input)
      );
      return nodes;
    }

    async findManyAndCount(
      input: IFindManyServiceInput<T>
    ): Promise<IConnection<T>> {
      const nodes = await this.readRepo.find(
        convertServiceFindManyInputToTypeorm(input)
      );
      const totalCount = await this.readRepo.count(
        convertServiceFindManyInputToTypeorm(input)
      );
      return { totalCount, nodes };
    }

    async findOne(
      id: string | FindOneOptions<T> | FindOptionsWhere<T>,
      options?: FindOneOptions<T>
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
