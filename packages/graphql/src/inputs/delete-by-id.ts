import { Field, InputType } from "@nestjs/graphql";
import { GraphQLUUID } from "graphql-scalars";

@InputType({ isAbstract: true })
export class DeleteByIDInput {
  @Field(() => GraphQLUUID)
  id!: string;
}
