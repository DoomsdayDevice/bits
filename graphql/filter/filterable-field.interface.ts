import { FilterComparisonOperators } from './filter-field-comparison.interface';
import { Type } from '@nestjs/common';

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
