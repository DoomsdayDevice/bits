import { Injectable, Type } from "@nestjs/common";
import { DeepPartial, ObjectLiteral, Repository } from "typeorm";
import { InjectRepository } from "@nestjs/typeorm";
import { NestedQuery } from "../query";
import { IReadableRepo } from "@bits/backend";
import {
  IFindManyServiceInput,
  IFindOneOptions,
  IFindOptionsWhere,
} from "@bits/backend";
import { convertServiceFindManyInputToTypeorm } from "../utils/conversion.utils";
import { IConnection } from "@bits/core";

export const ReadableRepoMixin = <
  Entity extends ObjectLiteral,
  Base extends Type<object>
>(
  EntityCls: Type<Entity>
) => {
  return (
    BaseCls: Base = class {} as Base
  ): Type<IReadableRepo<Entity> & InstanceType<Base>> => {
    @Injectable()
    class ReadableRepo extends BaseCls implements IReadableRepo<Entity> {
      @InjectRepository(EntityCls)
      public readonly readRepo!: Repository<Entity>;

      public count(filter?: IFindManyServiceInput<Entity>): Promise<number> {
        return this.readRepo.count(
          filter && (convertServiceFindManyInputToTypeorm(filter) as any)
        );
      }

      public create(newEntity: DeepPartial<Entity>): Promise<Entity> {
        const obj = this.readRepo.create(newEntity);

        return this.readRepo.save(obj);
      }

      public findMany(
        filter?: IFindManyServiceInput<Entity>
      ): Promise<Entity[]> {
        return this.readRepo.find(
          filter && (convertServiceFindManyInputToTypeorm(filter) as any)
        );
      }

      public findManyWithDeleted(
        filter: IFindManyServiceInput<Entity> = { withDeleted: true }
      ): Promise<Entity[]> {
        filter.withDeleted = true;
        return this.readRepo.find(
          convertServiceFindManyInputToTypeorm(filter) as any
        );
      }

      public async findOne(
        id: IFindOneOptions<Entity> | IFindOptionsWhere<Entity>,
        options: IFindOneOptions<Entity> = {}
      ): Promise<Entity> {
        options.where = id as any;
        const record = await this.readRepo.findOneOrFail(options as any);
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
          this.readRepo
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

      public async findManyAndCount(
        input: IFindManyServiceInput<Entity>
      ): Promise<IConnection<Entity>> {
        const [nodes, totalCount] = await this.readRepo.findAndCount(
          convertServiceFindManyInputToTypeorm(input) as any
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
        return "id" as any;
      }
    }
    return ReadableRepo as any;
  };
};
