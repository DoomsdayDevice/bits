import { Field, InputType, ObjectType } from "@nestjs/graphql";
import { Type } from "class-transformer";
import { GraphQLUUID } from "graphql-scalars";
import { FilterableField } from "../decorators/filterable-field.decorator";

@ObjectType({ isAbstract: true })
@InputType({ isAbstract: true })
export class BaseModel {
  @FilterableField(() => GraphQLUUID)
  id!: string;

  @Field()
  @Type(() => Date)
  createdAt!: Date;
}
