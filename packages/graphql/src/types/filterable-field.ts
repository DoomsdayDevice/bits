import { FilterComparisonOperators } from "@bits/core";
import { Type } from "@nestjs/common";
import { FieldOptions, ReturnTypeFunc } from "@nestjs/graphql";

export type FilterableFieldOptions = {
  allowedComparisons?: FilterComparisonOperators<unknown>[];
  filterRequired?: boolean;
} & FieldOptions;

export interface FilterableFieldDescriptor {
  propertyName: string;
  target: Type<unknown>;
  returnTypeFunc?: ReturnTypeFunc;
  advancedOptions?: FilterableFieldOptions;
}
