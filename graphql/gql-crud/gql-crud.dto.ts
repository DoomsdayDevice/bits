import { Field, InputType, Int, ObjectType, OmitType, PartialType } from '@nestjs/graphql';
import { GraphQLUUID } from 'graphql-scalars';
import { Type } from '@nestjs/common';
import { IUpdateOneInput } from '@bits/graphql/gql-crud/gql-crud.interface';

@InputType({ isAbstract: true })
export class DeleteByIDInput {
  @Field(() => GraphQLUUID)
  id!: string;
}
@InputType()
export class FindOneInput {
  @Field(() => GraphQLUUID)
  id!: string;
}

export function getDefaultUpdateOneInput<T>(
  ModelCls: Type<T>,
  modelName?: string,
): Type<IUpdateOneInput<T>> {
  const DefaultUpdate = PartialType(ModelCls, () =>
    InputType(`${modelName || ModelCls.name}Update`),
  );

  @InputType(`UpdateOne${modelName || ModelCls.name}Input`)
  class UpdateOneInput {
    @Field(() => GraphQLUUID)
    id!: string;

    @Field(() => DefaultUpdate)
    update!: Partial<T>;
  }

  return UpdateOneInput;
}

export function getDefaultCreateOneInput<T>(
  ModelCls: Type<T>,
  modelName?: string,
): Type<Omit<T, 'createdAt' | 'id'>> {
  return OmitType(ModelCls, ['createdAt' as keyof T, 'id' as keyof T] as const, () =>
    InputType(`CreateOne${modelName || ModelCls.name}Input`),
  ) as any;

  // @InputType(`CreateOne${modelName || ModelCls.name}Input`)
  // class CreateOneInput {
  //   @Field(() => DefaultUpdate)
  //   update!: Partial<T>;
  // }
  //
  // return CreateOneInput;
}

export function getDefaultModelConnection<T>(Model: Type<T>, modelName: string): any {
  @ObjectType(`${modelName}Connection`)
  class DtoConnectionCls {
    @Field(() => Int)
    totalCount = 0;

    @Field(() => [Model])
    nodes!: T[];
  }
  return DtoConnectionCls;
}
