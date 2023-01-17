import { Field, InputType, ObjectType } from '@nestjs/graphql';
import { Type } from 'class-transformer';
import { FilterableField } from '@bits/graphql/filter/filter-comparison.factory';
import { GraphQLUUID } from 'graphql-scalars';

@ObjectType({ isAbstract: true })
@InputType({ isAbstract: true })
export class BaseModel {
  @FilterableField(() => GraphQLUUID)
  id!: string;

  @Field()
  @Type(() => Date)
  createdAt!: Date;
}
