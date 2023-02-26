import { Field, InputType } from "@nestjs/graphql";
import { GraphQLUUID } from "graphql-scalars";

@InputType()
export class FindOneInput {
  @Field(() => GraphQLUUID)
  id!: string;
}
