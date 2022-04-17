import { Field, InputType, ObjectType } from '@nestjs/graphql';

@ObjectType({ isAbstract: true })
@InputType({ isAbstract: true })
export class BaseModel {
  @Field()
  id!: string;

  @Field()
  createdAt!: Date;
}
