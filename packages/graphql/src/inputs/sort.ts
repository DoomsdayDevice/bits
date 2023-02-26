import { Field, InputType } from "@nestjs/graphql";
import { SortDirection } from "@bits/core";

@InputType()
export class Sort {
  @Field()
  field!: string;

  @Field(() => SortDirection)
  direction!: SortDirection;
}
