// TODO add getOrCreate with memoize for nested filters
import { Field, InputType } from "@nestjs/graphql";
import {
  createFilterComparisonType,
  getFilterableFields,
} from "../utils/filter-comparison.factory";
import { ValidateNested } from "class-validator";
import { IGqlFilter } from "../types";
import { Class } from "@bits/core";
import { Type } from "class-transformer";
import { capitalize } from "lodash";

export function getDefaultFilter<T>(
  Model: Class<T>,
  modelName: string
): Class<IGqlFilter<T>> {
  @InputType(`${modelName}Filter`)
  class GraphQLFilter {
    @Field(() => [GraphQLFilter], { nullable: true })
    AND!: GraphQLFilter[];

    @Field(() => [GraphQLFilter], { nullable: true })
    OR!: GraphQLFilter[];
  }
  const filterableFields = getFilterableFields(Model);
  filterableFields.forEach(
    ({ propertyName, target, advancedOptions, returnTypeFunc }) => {
      const FC = createFilterComparisonType({
        FieldType: target,
        fieldName: `${modelName}${capitalize(propertyName)}`,
        allowedComparisons: advancedOptions?.allowedComparisons,
        returnTypeFunc,
      });
      const nullable = advancedOptions?.filterRequired !== true;
      ValidateNested()(GraphQLFilter.prototype, propertyName);
      Field(() => FC, { nullable })(GraphQLFilter.prototype, propertyName);
      Type(() => FC)(GraphQLFilter.prototype, propertyName);
    }
  );

  return GraphQLFilter as any;
}
