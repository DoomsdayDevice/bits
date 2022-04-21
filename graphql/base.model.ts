import { Field, InputType, ObjectType } from '@nestjs/graphql';
import { Type } from 'class-transformer';

@ObjectType({ isAbstract: true })
@InputType({ isAbstract: true })
export class BaseModel {
  @Field()
  id!: string;

  @Field({ nullable: true })
  @Type(() => Date)
  createdAt!: Date;
}
