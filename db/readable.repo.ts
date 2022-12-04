import { Injectable, Type } from '@nestjs/common';
import {
  Repository,
  DeepPartial,
  FindOneOptions,
  FindManyOptions,
  FindOptionsWhere,
  ILike,
} from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { IConnection } from '@bits/bits.types';
import { NestedQuery } from './nested-query';
import { NestedFindManyOpts, IReadableRepo } from './repo.interface';
import { IFindManyServiceInput } from '@bits/services/interface.service';
import { convertServiceFindManyInputToTypeorm } from '@bits/bits.utils';

export const ReadableRepoMixin = <Entity, Base extends Type<object>>(EntityCls: Type<Entity>) => {
  return (BaseCls: Base = class {} as Base): Type<IReadableRepo<Entity> & InstanceType<Base>> => {
    @Injectable()
    class ReadableRepo extends BaseCls implements IReadableRepo<Entity> {
      @InjectRepository(EntityCls) public readonly readRepo!: Repository<Entity>;

      public count(filter?: IFindManyServiceInput<Entity>): Promise<number> {
        return this.readRepo.count(convertServiceFindManyInputToTypeorm(filter));
      }

      public create(newEntity: DeepPartial<Entity>): Promise<Entity> {
        const obj = this.readRepo.create(newEntity);

        return this.readRepo.save(obj);
      }

      public findAll(filter?: IFindManyServiceInput<Entity>): Promise<Entity[]> {
        return this.readRepo.find(convertServiceFindManyInputToTypeorm(filter));
      }

      public findAllWithDeleted(
        filter: IFindManyServiceInput<Entity> = { withDeleted: true },
      ): Promise<Entity[]> {
        filter.withDeleted = true;
        return this.readRepo.find(convertServiceFindManyInputToTypeorm(filter));
      }

      public async findOne(
        id: string | FindOneOptions<Entity> | FindOptionsWhere<Entity>,
        options: FindOneOptions<Entity> = {},
      ): Promise<Entity> {
        options.where = id as any;
        const record = await this.readRepo.findOne(options);
        // if (!record) {
        //   throw new NotFoundException('the requested record was not found');
        // }
        return record;
      }

      /** adds nested filter */
      public async findNested({
        relations,
        where,
        take,
        skip,
        order,
      }: IFindManyServiceInput<Entity>): Promise<Entity[]> {
        const complexQuery = new NestedQuery(
          EntityCls,
          this.readRepo.metadata.discriminatorValue as any,
          this.readRepo,
        );

        const { nodes } = await complexQuery.execute({
          relations,
          where,
          take,
          skip,
          order,
        });
        return nodes;
      }

      public async findAndCount(
        input: IFindManyServiceInput<Entity>,
      ): Promise<IConnection<Entity>> {
        const [nodes, totalCount] = await this.readRepo.findAndCount(
          convertServiceFindManyInputToTypeorm(input),
        );
        return { totalCount, nodes };
        // const complexQuery = new NestedQuery(
        //   EntityCls,
        //   this.readRepo.metadata.discriminatorValue as any,
        //   this.readRepo,
        // );
        //
        // const { totalCount, nodes } = await complexQuery.execute({
        //   relations,
        //   where,
        //   take,
        //   skip,
        //   order,
        // });
        // return { totalCount, nodes };
      }
      getPrimaryColumnName(): keyof Entity {
        return 'id' as any;
      }
    }
    return ReadableRepo as any;
  };
};
