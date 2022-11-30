import { Field, InputType } from '@nestjs/graphql';
import { SortDirection } from '../../grpc/grpc.dto';

@InputType()
export class Sort {
  @Field()
  field!: string;

  @Field(() => SortDirection)
  direction!: SortDirection;
}
