/*
import { InjectRepository, TypeOrmModule } from '@nestjs/typeorm';
import { NestjsQueryTypeOrmModule, TypeOrmQueryService } from '@nestjs-query/query-typeorm';
import { IsNotEmpty, ValidateNested } from 'class-validator';
import { Type as CTType } from 'class-transformer';
import { Repository } from 'typeorm';
import { InjectQueryService, QueryService } from '@nestjs-query/core';
import {
  CRUDResolver,
  NestjsQueryGraphQLModule,
  PagingStrategies,
  QueryArgsType,
} from '@nestjs-query/query-graphql';
import { DynamicModule, Provider, Type, UseGuards, UseInterceptors } from '@nestjs/common';
import { IEnumEntity } from '@core/db/db.interface';
import { ArgsType, Field, InputType, Int, OmitType, PartialType, Resolver } from '@nestjs/graphql';
import { GraphQLUUID } from 'graphql-scalars';
import { BaseEntity } from '@core/db/base.entity';
import { CrudAuthGuard } from 'src/auth/domain.guard';
import { renameFunc } from '../utils';
import { CrudInterceptor } from '../../auth/domain.interceptor';

interface Opts {
  update?: any;
  entity: any;
  create?: any;
}

export class CrudModule {
  static makeCrud<E extends Type<BaseEntity>>(EClassArr: (E | Opts)[]): DynamicModule {
    const providers: Provider[] = [];

    for (const EClass of EClassArr) {
      if ('entity' in EClass) {
        providers.push(...this.getProviders(EClass.entity, EClass.create, EClass.update));
      } else {
        providers.push(...this.getProviders(EClass));
      }
    }
    const entities = EClassArr.map(e => {
      if ('entity' in e) return e.entity;
      return e;
    });

    return {
      providers,
      module: CrudModule,
      imports: [TypeOrmModule.forFeature(entities)],
      exports: [TypeOrmModule.forFeature(entities)],
    };
  }

  static getProviders<E extends BaseEntity>(
    Entity: Type<E>,
    C?: Type<Partial<E>>,
    U?: Type<Partial<E>>,
  ): any[] {
    const EntityQueryService = this.getQueryService(Entity);

    return [this.getResolver(Entity, C, U), EntityQueryService];
  }

  static getQueryService<E extends BaseEntity>(EClass: Type<E>): Type<TypeOrmQueryService<E>> {
    @QueryService(EClass)
    class EntityQueryService extends TypeOrmQueryService<E> {
      constructor(@InjectRepository(EClass) repo: Repository<E>) {
        super(repo, { useSoftDelete: false });
      }

      /**
       * обертка под таблицы с несколькими праймари ключами TODO сделать отдельный тип вместо json
       * @param id: string or stringified json (for tables with multiple primary keys)
       * @param opts
       */ /*
      deleteOne(id: any, opts?: any): Promise<E> {
        let parsedId: any;
        try {
          parsedId = JSON.parse(id);
        } catch {
          parsedId = id;
        }
        return super.deleteOne(parsedId, opts);
      }
    }

    renameFunc(EntityQueryService, `${EClass.name}QueryService`);
    return EntityQueryService;
  }

  static getResolver<
    E extends BaseEntity,
    EClass extends Type<E>,
    QS extends QueryService<E, unknown, unknown>,
    P extends Partial<E>
  >(
    Entity: EClass,
    CreateDTOClass = OmitType(
      Entity,
      ['createdAt', 'updatedAt', 'id'] as const,
      InputType.bind(null, `Create${Entity.name}`),
    ) as Type<P>,
    UpdateDTOClass = PartialType(
      OmitType(Entity, ['createdAt', 'updatedAt', 'id'] as const),
      InputType.bind(null, `Update${Entity.name}`),
    ) as Type<P>,
  ): Type<CRUDResolver<E, P, P, any>> {
    // RESOLVER
    @InputType()
    @ArgsType()
    class MySortType {
      @Field(() => Int)
      field!: number;
    }

    class MyQueryArgs extends QueryArgsType(Entity, {
      pagingStrategy: PagingStrategies.OFFSET,
      maxResultsSize: 500,
    }) {
      static SortType = MySortType as any;
    }

    @InputType(`UpdateOne${Entity.name}Input`)
    class UpdateOneInput {
      @Field(() => GraphQLUUID)
      @IsNotEmpty()
      id!: string;

      @Field(() => UpdateDTOClass)
      @CTType(() => UpdateDTOClass)
      @ValidateNested()
      update!: any; // TODO rm any
    }

    @UseGuards(CrudAuthGuard(Entity.name))
    @Resolver(() => Entity)
    @UseInterceptors(CrudInterceptor)
    class EntityResolver extends CRUDResolver(Entity, {
      pagingStrategy: PagingStrategies.OFFSET,
      enableTotalCount: true,
      guards: [CrudAuthGuard(Entity.name)],

      read: { maxResultsSize: 500, QueryArgs: MyQueryArgs },
      // delete: { DeleteOneInput: DeleteByIDInput }, // TODO add UUID to deletes and for multiple keys
      update: { UpdateDTOClass, UpdateOneInput },
      create: { CreateDTOClass },
    }) {
      constructor(@InjectQueryService(Entity) readonly service: QS) {
        super(service);
      }
    }

    renameFunc(EntityResolver, `${Entity.name}CrudResolver`);
    return EntityResolver;
  }

  /**
   * создает модуль для ЕНУМов
   * @param Entity
   * @param canUpdate
   */ /*
  static makeEnumCrud<EName extends string, EClass extends Type<IEnumEntity<EName>>>(
    Entity: EClass,
    canUpdate = true,
  ): DynamicModule {
    InputType({ isAbstract: true })(Entity);

    class CreateDTOClass extends Entity {}
    InputType(`Create${Entity.name}`)(CreateDTOClass);

    return NestjsQueryGraphQLModule.forFeature({
      imports: [NestjsQueryTypeOrmModule.forFeature([Entity])],
      resolvers: [
        {
          DTOClass: Entity,
          EntityClass: Entity,
          create: { CreateDTOClass, disabled: true },
          guards: [CrudAuthGuard(Entity.name)],
          pagingStrategy: PagingStrategies.NONE,
          update: canUpdate
            ? {
                UpdateDTOClass: OmitType(
                  Entity,
                  ['name'] as const,
                  InputType.bind(null, `Update${Entity.name}`),
                ),
              }
            : {},
          delete: { disabled: true },
          enableTotalCount: true,
        },
      ],
    });
  }
}

*/
