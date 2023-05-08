import {
  BadRequestException,
  Injectable,
  NotFoundException,
  Type,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { QueryDeepPartialEntity } from "typeorm/query-builder/QueryPartialEntity";
import { SaveOptions } from "typeorm/repository/SaveOptions";
import { FindOneOptions } from "typeorm/find-options/FindOneOptions";
import {
  DeleteResult,
  IFindOptionsWhere,
  IWritableRepo,
  MethodNotImplementedError,
} from "@bits/backend";
import { renameFunc } from "@bits/core";
import { ObjectLiteral } from "@bits/core";
import { Repository } from "typeorm";
import { DeepPartial } from "@bits/core";

export const SimpleWritableRepoMixin = <Entity extends ObjectLiteral>(
  ModelRef: Type<Entity>
) => {
  return <B extends {}>(
    BaseCls: Type<B> = class {} as any
  ): Type<IWritableRepo<Entity> & B> => {
    @Injectable()
    class WritableRepo
      extends (BaseCls as any)
      implements IWritableRepo<Entity>
    {
      @InjectRepository(ModelRef)
      public readonly writeRepo!: Repository<Entity>;

      public create(newEntity: DeepPartial<Entity>): Promise<Entity> {
        const obj = this.writeRepo.create(newEntity as any);

        return this.writeRepo.save(obj) as any;
      }

      public async updateOne(
        idOrConditions: string | IFindOptionsWhere<Entity>,
        partialEntity: QueryDeepPartialEntity<Entity>
        // ...options: any[]
      ): Promise<Entity> {
        try {
          const result = await this.writeRepo.update(
            idOrConditions,
            partialEntity
          );
          const updated = await this.writeRepo.findOneByOrFail(
            typeof idOrConditions === "string"
              ? ({ id: idOrConditions } as any)
              : idOrConditions
          );
          if (result.affected) return updated;
          else throw Error("not updated");
        } catch (err) {
          throw new BadRequestException(err);
        }
      }

      public updateMany(
        idOrConditions: string | IFindOptionsWhere<Entity>,
        partialEntity: DeepPartial<Entity>
      ): Promise<Entity[]> {
        throw new MethodNotImplementedError("updateMany");
      }

      public save<T extends DeepPartial<Entity>>(
        entityOrEntities: T | T[],
        options?: SaveOptions
      ): Promise<T | T[]> {
        try {
          return this.writeRepo.save(entityOrEntities as any, options);
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
        if (!result.affected) throw new Error("The record was not found");
        return Boolean(result.affected);
      }

      // fast query
      public async hardDelete(
        criteria: string | number | IFindOptionsWhere<Entity>
        /* ...options: any[] */
      ): Promise<DeleteResult> {
        try {
          return this.writeRepo.delete(criteria);
        } catch (err) {
          throw new NotFoundException(
            "The record was not found",
            JSON.stringify(err)
          );
        }
      }
    }
    renameFunc(WritableRepo, `Writable${ModelRef.name}Repo`);
    return WritableRepo as any;
  };
};
