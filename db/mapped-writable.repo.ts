import { BadRequestException, Injectable, NotFoundException, Type } from '@nestjs/common';
import { Repository, DeepPartial, DeleteResult, FindOptionsWhere, ObjectLiteral } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { QueryDeepPartialEntity } from 'typeorm/query-builder/QueryPartialEntity';
import { SaveOptions } from 'typeorm/repository/SaveOptions';
import { IWritableRepo } from '@bits/db/repo.interface';
import { FindOneOptions } from 'typeorm/find-options/FindOneOptions';

export const MappedWritableRepoMixin = <Entity extends ObjectLiteral, Model extends ObjectLiteral>(
  EntityCls: Type<Entity>,
  ModelCls: Type<Model>,
) => {
  return <B extends {}>(BaseCls: Type<B> = class {} as any): Type<IWritableRepo<Entity> & B> => {
    @Injectable()
    class MappedWritableRepo extends (BaseCls as any) {
      @InjectRepository(EntityCls) public readonly writeRepo!: Repository<Entity>;

      public create(newEntity: DeepPartial<Entity>): Promise<Entity> {
        const obj = this.writeRepo.create(newEntity);

        return this.writeRepo.save(obj);
      }

      public async update(
        idOrConditions: string | FindOptionsWhere<Entity>,
        partialEntity: QueryDeepPartialEntity<Entity>,
        // ...options: any[]
      ): Promise<boolean> {
        try {
          const result = await this.writeRepo.update(idOrConditions, partialEntity);
          if (result.affected) return true;
          else throw Error('not updated');
        } catch (err) {
          throw new BadRequestException(err);
        }
      }

      public save<T extends DeepPartial<Entity>>(
        entityOrEntities: T | T[],
        options?: SaveOptions,
      ): Promise<T | T[]> {
        try {
          return this.writeRepo.save<T>(entityOrEntities as any, options);
        } catch (err) {
          throw new BadRequestException(err);
        }
      }

      public async deleteOne(id: FindOneOptions<Entity>): Promise<boolean> {
        const e = await this.writeRepo.findOneByOrFail(id as any);
        const result = await this.writeRepo.remove(e);
        // const result = await this.hardDelete(id);
        // const result = await this.writeRepo.softDelete(id);
        // if (!result.affected) throw new Error('The record was not found');
        return true;
        // return Boolean(result.affected);
      }

      public async restoreOne(id: string): Promise<boolean> {
        const result = await this.writeRepo.restore(id);
        if (!result.affected) throw new Error('The record was not found');
        return Boolean(result.affected);
      }

      // fast query
      public async hardDelete(
        criteria: string | number | FindOptionsWhere<Entity>,
        /* ...options: any[] */
      ): Promise<DeleteResult> {
        try {
          return this.writeRepo.delete(criteria);
        } catch (err) {
          throw new NotFoundException('The record was not found', JSON.stringify(err));
        }
      }
    }
    return MappedWritableRepo as any;
  };
};
