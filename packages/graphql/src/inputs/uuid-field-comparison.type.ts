import { Field, InputType } from "@nestjs/graphql";
import { IsBoolean, IsDate, IsOptional } from "class-validator";
import { GraphQLUUID } from "graphql-scalars";
import { Type } from "@nestjs/common";
import { IsUndefined } from "../validators/is-undefined.validator";
import { FilterFieldComparison } from "@bits/core";

/** @internal */
let uuidFieldComparison: Type<FilterFieldComparison<string>>;

/** @internal */
export function getOrCreateUUIDFieldComparison(): Type<
  FilterFieldComparison<string>
> {
  if (uuidFieldComparison) {
    return uuidFieldComparison;
  }

  @InputType()
  class UUIDFieldComparison {
    @Field(() => Boolean, { nullable: true })
    @IsBoolean()
    @IsOptional()
    is?: boolean | null;

    @Field(() => Boolean, { nullable: true })
    @IsBoolean()
    @IsOptional()
    isNot?: boolean | null;

    @Field(() => GraphQLUUID, { nullable: true })
    @IsUndefined()
    @IsDate()
    eq?: string;

    @Field(() => GraphQLUUID, { nullable: true })
    @IsUndefined()
    @IsDate()
    neq?: string;

    @Field(() => [GraphQLUUID], { nullable: true })
    @IsUndefined()
    @IsDate({ each: true })
    in?: string[];

    @Field(() => [GraphQLUUID], { nullable: true })
    @IsUndefined()
    @IsDate({ each: true })
    notIn?: string[];
  }

  uuidFieldComparison = UUIDFieldComparison as Type<
    FilterFieldComparison<string>
  >;
  return uuidFieldComparison;
}
