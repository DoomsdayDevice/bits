import { NestjsQueryTypeOrmModule } from '@nestjs-query/query-typeorm';

import { DynamicModule, Type } from '@nestjs/common';
import { Field, InputType } from '@nestjs/graphql';
import { GraphQLUUID } from 'graphql-scalars';
import { NestjsQueryGraphQLModule, PagingStrategies } from '@nestjs-query/query-graphql';

@InputType({ isAbstract: true })
class DeleteByIDInput {
    @Field(() => GraphQLUUID)
    id!: string;
}

export function GqlCrudModule<T extends any>(
    Entity: Type<T>,
    // CreateDTOClass = OmitType(
    //   Entity,
    //   ['deletedAt', 'createdAt', 'updatedAt', 'id'] as const,
    //   InputType.bind(null, `Create${Entity.name}`),
    // ),
    // UpdateDTOClass = PartialType(
    //   OmitType(Entity, ['deletedAt', 'createdAt', 'updatedAt', 'id'] as const),
    //   InputType.bind(null, `Update${Entity.name}`),
    // ),
): DynamicModule {
    // @QueryService(Entity)
    // class EntityQueryService extends TypeOrmQueryService<T> {
    //   constructor(@InjectRepository(Entity) repo: Repository<T>) {
    //     super(repo, { useSoftDelete: true });
    //   }
    // }

    const serviceName = `${Entity.name}QueryService`;
    // renameFunc(EntityQueryService, serviceName);

    // @InputType()
    // @ArgsType()
    // class MySortType {
    //   @Field(() => Int)
    //   field!: number;
    // }
    //
    // class MyQueryArgs extends QueryArgsType(Entity, {
    //   pagingStrategy: PagingStrategies.OFFSET,
    //   maxResultsSize: 500,
    // }) {
    //   static SortType = MySortType as any;
    //
    //   SortType = MySortType as any;
    // }
    //
    // const resolverOpts: ResolverOpts = ;
    // resolverOpts.create = { CreateDTOClass };

    // @InputType(`UpdateOne${Entity.name}Input`)
    // class UpdateOneInput {
    //   @Field(() => GraphQLUUID)
    //   id!: string;
    //
    //   @Field(() => UpdateDTOClass)
    //   @CTType(() => UpdateDTOClass)
    //   @ValidateNested()
    //   update!: any;
    // }

    // resolverOpts.update = { UpdateDTOClass, UpdateOneInput };

    return NestjsQueryGraphQLModule.forFeature({
        imports: [NestjsQueryTypeOrmModule.forFeature([Entity])],
        // services: [EntityQueryService],
        resolvers: [
            {
                DTOClass: Entity,
                EntityClass: Entity,
                // ServiceClass: EntityQueryService,
                // guards: [CrudAuthGuard(Entity.name)],
                // enableTotalCount: true,
                pagingStrategy: PagingStrategies.NONE,
                // read: { maxResultsSize: 500, QueryArgs: MyQueryArgs },
                // delete: { DeleteOneInput: DeleteByIDInput },
                // update: { UpdateOneInput: DeleteByUUIDInput },
                // enableAggregate: true,
            },
        ],
    });
}
