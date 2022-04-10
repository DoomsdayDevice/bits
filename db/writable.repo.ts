import { BadRequestException, Injectable, NotFoundException, Type } from '@nestjs/common';
import { Repository, DeepPartial, FindConditions, UpdateResult, DeleteResult } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { QueryDeepPartialEntity } from 'typeorm/query-builder/QueryPartialEntity';
import { SaveOptions } from 'typeorm/repository/SaveOptions';
import { ReadableRepoMixin } from '@bits/db/readable.repo';
import { IWritableRepo } from '@bits/db/repo.interface';

export const WritableRepoMixin = <Entity, Base extends Type<object>>(EntityCls: Type<Entity>) => {
  return (BaseCls: Base = class {} as Base): Type<IWritableRepo<Entity> & InstanceType<Base>> => {
    @Injectable()
    class WritableRepo extends ReadableRepoMixin(EntityCls)(BaseCls) {
      @InjectRepository(EntityCls) public readonly repository!: Repository<Entity>;

      public create(newEntity: DeepPartial<Entity>): Promise<Entity> {
        const obj = this.repository.create(newEntity);

        return this.repository.save(obj);
      }

      public async update(
        idOrConditions: string | FindConditions<Entity>,
        partialEntity: QueryDeepPartialEntity<Entity>,
        // ...options: any[]
      ): Promise<UpdateResult | Entity> {
        try {
          return await this.repository.update(idOrConditions, partialEntity);
        } catch (err) {
          throw new BadRequestException(err);
        }
      }

      public save<T extends DeepPartial<Entity>>(
        entityOrEntities: T | T[],
        options?: SaveOptions,
      ): Promise<T | T[]> {
        try {
          return this.repository.save<T>(entityOrEntities as any, options);
        } catch (err) {
          throw new BadRequestException(err);
        }
      }

      public async deleteOne(id: string): Promise<boolean> {
        const result = await this.repository.softDelete(id);
        if (!result.affected) throw new Error('The record was not found');
        return Boolean(result.affected);
      }

      public async restoreOne(id: string): Promise<boolean> {
        const result = await this.repository.restore(id);
        if (!result.affected) throw new Error('The record was not found');
        return Boolean(result.affected);
      }

      public async hardDelete(
        criteria: string | number | FindConditions<Entity>,
        /* ...options: any[] */
      ): Promise<DeleteResult> {
        try {
          return this.repository.delete(criteria);
        } catch (err) {
          throw new NotFoundException('The record was not found', JSON.stringify(err));
        }
      }
    }
    return WritableRepo as any;
  };
};
