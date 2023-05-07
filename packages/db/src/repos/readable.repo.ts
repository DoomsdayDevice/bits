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
import { IConnection, renameFunc } from "@bits/core";

export const ReadableRepoMixin = <
  Model extends ObjectLiteral,
  Base extends Type<object>
>(
  ModelRef: Type<Model>
) => {
  return (
    BaseCls: Base = class {} as Base
  ): Type<IReadableRepo<Model> & InstanceType<Base>> => {
    @Injectable()
    class ReadableRepo extends BaseCls implements IReadableRepo<Model> {
      @InjectRepository(ModelRef)
      public readonly readRepo!: Repository<Model>;

      public count(filter?: IFindManyServiceInput<Model>): Promise<number> {
        return this.readRepo.count(
          filter && (convertServiceFindManyInputToTypeorm(filter) as any)
        );
      }

      public create(newEntity: DeepPartial<Model>): Promise<Model> {
        const obj = this.readRepo.create(newEntity);

        return this.readRepo.save(obj);
      }

      public findMany(filter?: IFindManyServiceInput<Model>): Promise<Model[]> {
        return this.readRepo.find(
          filter && (convertServiceFindManyInputToTypeorm(filter) as any)
        );
      }

      public findManyWithDeleted(
        filter: IFindManyServiceInput<Model> = { withDeleted: true }
      ): Promise<Model[]> {
        filter.withDeleted = true;
        return this.readRepo.find(
          convertServiceFindManyInputToTypeorm(filter) as any
        );
      }

      public async findOne(
        id: IFindOneOptions<Model> | IFindOptionsWhere<Model>,
        options: IFindOneOptions<Model> = {}
      ): Promise<Model> {
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
      }: IFindManyServiceInput<Model>): Promise<Model[]> {
        const complexQuery = new NestedQuery(
          ModelRef,
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
        input: IFindManyServiceInput<Model>
      ): Promise<IConnection<Model>> {
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

      getPrimaryColumnName(): keyof Model {
        return "id" as any;
      }
    }
    renameFunc(ReadableRepo, `Readable${ModelRef.name}Repo`);
    return ReadableRepo as any;
  };
};
