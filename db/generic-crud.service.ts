import { Type } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  FindManyOptions,
  FindOneOptions,
  FindOptionsWhere,
  ObjectLiteral,
  Repository,
} from 'typeorm';
import { ICrudService } from '@bits/services/interface.service';
import { QueryDeepPartialEntity } from 'typeorm/query-builder/QueryPartialEntity';
import { IConnection } from '@bits/bits.types';

export function getGenericCrudService<T extends ObjectLiteral, DTO = T, Enums = never>(
  TClass: Type<T>,
  DTOClass?: Type<DTO>,
): Type<ICrudService<T>> {
  class GenericCrudService implements ICrudService<T> {
    @InjectRepository(TClass) writeRepo!: Repository<T>;

    @InjectRepository(TClass) readRepo!: Repository<T>;

    async findMany(input: FindManyOptions<T>): Promise<T[]> {
      const nodes = await this.readRepo.find(input);
      return nodes;
    }

    async findManyAndCount(input: FindManyOptions<T>): Promise<IConnection<T>> {
      const nodes = await this.readRepo.find(input);
      const totalCount = await this.readRepo.count(input);
      return { totalCount, nodes };
    }

    async findOne(
      id: string | FindOneOptions<T> | FindOptionsWhere<T>,
      options?: FindOneOptions<T>,
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
      partialEntity: QueryDeepPartialEntity<T>,
    ): Promise<boolean> {
      await this.writeRepo.save({ id: idOrConditions, ...partialEntity } as any);
      return true;
    }

    async createOne(input: any): Promise<T> {
      return this.writeRepo.save(input as T);
    }

    count(input: any) {
      return this.readRepo.count(input);
    }

    getPrimaryColumnName() {
      return 'id';
    }
  }

  return GenericCrudService;
}
