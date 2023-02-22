import { Injectable, Type } from '@nestjs/common';
import { Repository, FindOneOptions, FindOptionsWhere, ObjectLiteral } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { IConnection } from '@bits/bits.types';
import { IFindManyServiceInput } from '@bits/services/interface.service';
import { convertServiceFindManyInputToTypeorm } from '@bits/utils/conversions';
import { InjectMapper } from '@automapper/nestjs';
import { Mapper } from '@automapper/core';
import { IReadableRepo } from './repo.interface';

// TODO remove all any's
export const MappedReadableRepoMixin = <
  Entity extends ObjectLiteral,
  Model extends ObjectLiteral,
  Base extends Type<object>,
>(
  EntityCls: Type<Entity>,
  ModelCls: Type<Model>,
) => {
  return (BaseCls: Base = class {} as Base): Type<IReadableRepo<Model> & InstanceType<Base>> => {
    @Injectable()
    class ReadableRepo extends BaseCls implements IReadableRepo<Model> {
      @InjectRepository(EntityCls) public readonly readRepo!: Repository<Model>; // TODO fix this
      @InjectRepository(EntityCls) public readonly entityRepo!: Repository<Entity>;
      @InjectMapper() mapper!: Mapper;

      public count(filter?: IFindManyServiceInput<Model>): Promise<number> {
        return this.entityRepo.count(filter && convertServiceFindManyInputToTypeorm(filter as any));
      }

      public async findAll(filter?: IFindManyServiceInput<Model>): Promise<Model[]> {
        const fromDb: Entity[] = (await this.entityRepo.find(
          filter && convertServiceFindManyInputToTypeorm(filter as any),
        )) as any;
        const mapped = this.mapper.mapArray<Entity, Model>(fromDb, EntityCls, ModelCls);

        return mapped;
      }

      public findAllWithDeleted(
        filter: IFindManyServiceInput<Model> = { withDeleted: true },
      ): Promise<Model[]> {
        filter.withDeleted = true;
        return this.entityRepo.find(convertServiceFindManyInputToTypeorm(filter as any)) as any;
      }

      public async findOne(
        id: FindOneOptions<Model> | FindOptionsWhere<Model>,
        options: FindOneOptions<Model> = {},
      ): Promise<Model> {
        options.where = id as any;
        const record: Entity = await this.entityRepo.findOneOrFail(options as any);
        return this.mapper.map(record, EntityCls, ModelCls);
      }

      public async findAndCount(input: IFindManyServiceInput<Model>): Promise<IConnection<Model>> {
        const [nodes, totalCount] = (await this.entityRepo.findAndCount(
          convertServiceFindManyInputToTypeorm(input as any),
        )) as any;

        const mapped = this.mapper.mapArray<Entity, Model>(nodes, EntityCls, ModelCls);
        return { totalCount, nodes: mapped };
      }

      getPrimaryColumnName(): keyof Model {
        return 'id' as any;
      }
    }
    return ReadableRepo as any;
  };
};
