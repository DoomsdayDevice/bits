import { Injectable, Type } from "@nestjs/common";
import { ObjectLiteral, Repository } from "typeorm";
import { InjectRepository } from "@nestjs/typeorm";
import { InjectMapper } from "@automapper/nestjs";
import { Mapper } from "@automapper/core";
import {
  IFindManyServiceInput,
  IFindOneOptions,
  IFindOptionsWhere,
  IReadableRepo,
} from "@bits/backend";
import { convertServiceFindManyInputToTypeorm } from "../utils";
import { IConnection, renameFunc } from "@bits/core";

// TODO remove all any's
export const ReadableRepoMixin = <
  Entity extends ObjectLiteral,
  Model extends ObjectLiteral,
  Base extends Type<object>
>(
  EntityCls: Type<Entity>,
  ModelRef: Type<Model>
) => {
  return (
    BaseCls: Base = class {} as Base
  ): Type<IReadableRepo<Model> & InstanceType<Base>> => {
    @Injectable()
    class ReadableRepo extends BaseCls implements IReadableRepo<Model> {
      @InjectRepository(EntityCls)
      public readonly entityRepo!: Repository<Entity>;
      @InjectMapper() mapper!: Mapper;

      public count(filter?: IFindManyServiceInput<Model>): Promise<number> {
        return this.entityRepo.count(
          filter && convertServiceFindManyInputToTypeorm(filter as any)
        );
      }

      public async findMany(
        filter?: IFindManyServiceInput<Model>
      ): Promise<Model[]> {
        const fromDb: Entity[] = (await this.entityRepo.find(
          filter && (convertServiceFindManyInputToTypeorm(filter) as any)
        )) as any;
        const mapped = this.mapper.mapArray<Entity, Model>(
          fromDb,
          EntityCls,
          ModelRef
        );

        return mapped;
      }

      public findManyWithDeleted(
        filter: IFindManyServiceInput<Model> = { withDeleted: true }
      ): Promise<Model[]> {
        filter.withDeleted = true;
        return this.entityRepo.find(
          convertServiceFindManyInputToTypeorm(filter) as any
        ) as any;
      }

      public async findOne(
        id: IFindOneOptions<Model> | IFindOptionsWhere<Model>,
        options: IFindOneOptions<Model> = {}
      ): Promise<Model> {
        options.where = id as any;
        const record: Entity = await this.entityRepo.findOneOrFail(
          options as any
        );
        return this.mapper.map(record, EntityCls, ModelRef);
      }

      public async findManyAndCount(
        input: IFindManyServiceInput<Model>
      ): Promise<IConnection<Model>> {
        const [nodes, totalCount] = (await this.entityRepo.findAndCount(
          convertServiceFindManyInputToTypeorm(input) as any
        )) as any;

        const mapped = this.mapper.mapArray<Entity, Model>(
          nodes,
          EntityCls,
          ModelRef
        );
        return { totalCount, nodes: mapped };
      }

      getPrimaryColumnName(): keyof Model {
        return "id" as any;
      }
    }
    renameFunc(ReadableRepo, `MappedReadable${ModelRef.name}Repo`);
    return ReadableRepo as any;
  };
};
