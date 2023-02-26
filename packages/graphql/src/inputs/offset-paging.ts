import { Field, InputType, Int } from '@nestjs/graphql';

@InputType()
export class OffsetPagination {
  @Field(() => Int, { nullable: true })
  limit?: number;

  @Field(() => Int, { nullable: true })
  offset?: number;
}
