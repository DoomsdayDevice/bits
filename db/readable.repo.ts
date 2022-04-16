import { Injectable, NotFoundException, Type } from '@nestjs/common';
import { Repository, DeepPartial, FindOneOptions, FindConditions, FindManyOptions } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { NestedQuery } from './nested-query';
import { NestedFindManyOpts, IReadableRepo } from './repo.interface';

export const ReadableRepoMixin = <Entity, Base extends Type<object>>(EntityCls: Type<Entity>) => {
  return (BaseCls: Base = class {} as Base): Type<IReadableRepo<Entity> & InstanceType<Base>> => {
    @Injectable()
    class ReadableRepo extends BaseCls implements IReadableRepo<Entity> {
      @InjectRepository(EntityCls) public readonly readRepo!: Repository<Entity>;

      public count(filter?: FindManyOptions<Entity>): Promise<number> {
        return this.readRepo.count(filter);
      }

      public create(newEntity: DeepPartial<Entity>): Promise<Entity> {
        const obj = this.readRepo.create(newEntity);

        return this.readRepo.save(obj);
      }

      public findAll(filter?: FindManyOptions<Entity>): Promise<Entity[]> {
        return this.readRepo.find(filter);
      }

      public findAllWithDeleted(
        filter: FindManyOptions<Entity> = { withDeleted: true },
      ): Promise<Entity[]> {
        filter.withDeleted = true;
        return this.readRepo.find(filter);
      }

      public async findOne(
        id: string | FindOneOptions<Entity> | FindConditions<Entity>,
        options?: FindOneOptions<Entity>,
      ): Promise<Entity> {
        const record = await this.readRepo.findOne(id as any, options);
        if (!record) {
          throw new NotFoundException('the requested record was not found');
        }
        return record;
      }

      /** adds nested filter */
      public async findNested({
        relations,
        where,
        take,
        skip,
        orderBy,
      }: NestedFindManyOpts<Entity>): Promise<Entity[]> {
        const complexQuery = new NestedQuery<Entity>(
          this.readRepo.metadata.discriminatorValue as any,
          this.readRepo,
        );

        const { items } = await complexQuery.execute({
          relations,
          where,
          take,
          skip,
          orderBy,
        });
        return items;
      }

      public async findNestedAndCount({
        relations,
        where,
        take,
        skip,
        orderBy,
      }: NestedFindManyOpts<Entity>): Promise<any> {
        const complexQuery = new NestedQuery<Entity>(
          this.readRepo.metadata.discriminatorValue as any,
          this.readRepo,
        );

        const { totalCount, items } = await complexQuery.execute({
          relations,
          where,
          take,
          skip,
          orderBy,
        });
        return { totalCount, items };
      }
    }
    return ReadableRepo as any;
  };
};
