import { Injectable } from "@nestjs/common";
import { DeepPartial, ObjectLiteral, Repository } from "typeorm";
import { InjectRepository } from "@nestjs/typeorm";
import { NestedQuery } from "../query";
import { IReadableRepo } from "@bits/backend";
import {
  IFindManyServiceInput,
  IFindOneOptions,
  IFindOptionsWhere,
} from "@bits/backend";
import {
  convertServiceFindManyInputToTypeorm,
  convertServiceFindOneInputToTypeorm,
} from "../utils";
import { Class, IConnection, renameFunc } from "@bits/core";

export const SimpleReadableRepoMixin =
  <Entity extends ObjectLiteral>(EntityRef: Class<Entity>) =>
  <Base extends Class>(
    BaseCls: Base = class {} as Base
  ): Class<IReadableRepo<Entity>> => {
    @Injectable()
    class ReadableRepo extends BaseCls implements IReadableRepo<Entity> {
      @InjectRepository(EntityRef as any) // TODO
      public readonly readRepo!: Repository<Entity>;

      public count(filter?: IFindManyServiceInput<Entity>): Promise<number> {
        return this.readRepo.count(
          filter && convertServiceFindManyInputToTypeorm(filter)
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
          filter && convertServiceFindManyInputToTypeorm(filter)
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
        return this.readRepo.findOneOrFail(
          convertServiceFindOneInputToTypeorm(options)
        );
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
          EntityRef,
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

    renameFunc(ReadableRepo, `Readable${EntityRef.name}Repo`);
    return ReadableRepo as any;
  };
