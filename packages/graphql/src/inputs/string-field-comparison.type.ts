import { Field, InputType } from "@nestjs/graphql";
import { IsString } from "class-validator";
import { Type } from "@nestjs/common";
import { FilterFieldComparison } from "../types";
import { IsUndefined } from "../validators/is-undefined.validator";

/** @internal */
let stringFieldComparison: Type<FilterFieldComparison<string>>;

/** @internal */
export function getOrCreateStringFieldComparison(): Type<
  FilterFieldComparison<string>
> {
  if (stringFieldComparison) {
    return stringFieldComparison;
  }
  @InputType()
  class StringFieldComparison {
    @Field({ nullable: true })
    @IsString()
    eq?: string;

    @Field(() => [String], { nullable: true })
    @IsUndefined()
    @IsString({ each: true })
    in?: string[];

    @Field({ nullable: true })
    @IsString()
    @IsUndefined()
    like?: string;

    @Field({ nullable: true })
    @IsString()
    @IsUndefined()
    notLike?: string;

    @Field({ nullable: true })
    @IsString()
    @IsUndefined()
    iLike?: string;

    @Field({ nullable: true })
    @IsString()
    @IsUndefined()
    notILike?: string;
  }
  stringFieldComparison = StringFieldComparison as Type<
    FilterFieldComparison<string>
  >;
  return stringFieldComparison;
}
