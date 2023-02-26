import { Type } from "@nestjs/common";
import {
  Field,
  Float,
  GraphQLISODateTime,
  GraphQLTimestamp,
  ID,
  InputType,
  Int,
  ReturnTypeFunc,
  ReturnTypeFuncValue,
  TypeMetadataStorage,
} from "@nestjs/graphql";
import { EnumMetadata } from "@nestjs/graphql/dist/schema-builder/metadata";
import { LazyMetadataStorage } from "@nestjs/graphql/dist/schema-builder/storages/lazy-metadata.storage";
import { IsBoolean, IsOptional } from "class-validator";
import { Type as TransformerType } from "class-transformer";
import { GraphQLUUID } from "graphql-scalars";
import {
  FilterComparisonOperators,
  FilterFieldComparison,
} from "../types/filter-field-comparison";
import { getOrCreateStringFieldComparison } from "../inputs/string-field-comparison.type";
import { getOrCreateUUIDFieldComparison } from "../inputs/uuid-field-comparison.type";
import { ArrayReflector, getPrototypeChain, MapReflector } from "@bits/backend";
import {
  FilterableFieldDescriptor,
  FilterableFieldOptions,
} from "../types/filterable-field";
import { capitalizeFirstLetter } from "@bits/core";
import { SkipIf } from "../decorators";
import { IsUndefined } from "../validators/is-undefined.validator";

const filterComparisonMap = new Map<
  string,
  () => Type<FilterFieldComparison<unknown>>
>();
filterComparisonMap.set(
  "StringFilterComparison",
  getOrCreateStringFieldComparison
);
filterComparisonMap.set("UUIDFilterComparison", getOrCreateUUIDFieldComparison);

const FILTERABLE_FIELD_KEY = "FILTERABLE_FIELD_KEY";
export const filterableFieldReflector = new ArrayReflector(
  FILTERABLE_FIELD_KEY
);

const filterTypeReflector = new MapReflector("nestjs-query:filter-type");

export function getFilterableFields<DTO>(
  DTOClass: Type<DTO>
): FilterableFieldDescriptor[] {
  return getPrototypeChain(DTOClass).reduce((fields, Cls) => {
    const existingFieldNames = fields.map((t: any) => t.propertyName);
    const typeFields =
      filterableFieldReflector.get<unknown, FilterableFieldDescriptor>(Cls) ??
      [];
    const newFields = typeFields.filter(
      (t) => !existingFieldNames.includes(t.propertyName)
    );
    return [...newFields, ...fields];
  }, [] as FilterableFieldDescriptor[]);
}

export function getOrCreateFilterType<T>(
  ModelCls: Type<T>,
  name: string
  // filterableRelations: FilterableRelations = {},
  // getFR: boolean = false,
) {
  return filterTypeReflector.memoize(ModelCls, name, () => {
    const fields = getFilterableFields(ModelCls);
    if (!fields.length) {
      throw new Error(
        `No fields found to create GraphQLFilter for ${ModelCls.name}`
      );
    }
    // const hasRequiredFilters = fields.some(f => f.advancedOptions?.filterRequired === true);
  });
}

const knownTypes: Set<ReturnTypeFuncValue> = new Set([
  String,
  Number,
  Boolean,
  Int,
  Float,
  ID,
  Date,
  GraphQLUUID,
  GraphQLISODateTime,
  GraphQLTimestamp,
]);
type FilterComparisonOptions<T> = {
  FieldType: Type<T>;
  fieldName: string;
  allowedComparisons?: FilterComparisonOperators<T>[];
  returnTypeFunc?: ReturnTypeFunc;
};

const isCustomFieldComparison = <T>(
  options: FilterComparisonOptions<T>
): boolean => {
  return !!options.allowedComparisons;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const isNamed = (SomeType: any): SomeType is { name: string } => {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  return "name" in SomeType && typeof SomeType.name === "string";
};

// eslint-disable-next-line @typescript-eslint/ban-types
export function getGraphqlEnumMetadata(
  objType: object
): EnumMetadata | undefined {
  // hack to get enums loaded it may break in the future :(
  LazyMetadataStorage.load();
  return TypeMetadataStorage.getEnumsMetadata().find((o) => o.ref === objType);
}

const getTypeName = (SomeType: ReturnTypeFuncValue): string => {
  if (knownTypes.has(SomeType) || isNamed(SomeType)) {
    const typeName = (SomeType as { name: string }).name;
    return capitalizeFirstLetter(typeName);
  }
  if (typeof SomeType === "object") {
    const enumType = getGraphqlEnumMetadata(SomeType);
    if (enumType) {
      return capitalizeFirstLetter(enumType.name);
    }
  }
  throw new Error(
    `Unable to create filter comparison for ${JSON.stringify(SomeType)}.`
  );
};

const getComparisonTypeName = <T>(
  fieldType: ReturnTypeFuncValue,
  options: FilterComparisonOptions<T>
): string => {
  if (isCustomFieldComparison(options)) {
    return `${capitalizeFirstLetter(options.fieldName)}FilterComparison`;
  }
  return `${getTypeName(fieldType)}FilterComparison`;
};

const isNotAllowedChecker = (options: FilterComparisonOptions<unknown>) => {
  const { allowedComparisons } = options;
  return (cmp: FilterComparisonOperators<unknown>) => () => {
    return allowedComparisons ? !allowedComparisons.includes(cmp) : false;
  };
};

export function createFilterComparisonType<T>(
  options: FilterComparisonOptions<T>
): Type<FilterFieldComparison<T>> {
  const { FieldType, returnTypeFunc } = options;
  const fieldType = returnTypeFunc ? returnTypeFunc() : FieldType;
  const inputName = getComparisonTypeName(fieldType, options);
  const generator = filterComparisonMap.get(inputName);
  if (generator) {
    return generator() as Type<FilterFieldComparison<T>>;
  }

  const isNotAllowed = isNotAllowedChecker(
    options as FilterComparisonOptions<unknown>
  ) as any;
  @InputType(inputName)
  class Fc {
    @SkipIf(isNotAllowed("is"), Field(() => Boolean, { nullable: true }))
    @IsBoolean()
    @IsOptional()
    is?: boolean | null;

    @SkipIf(isNotAllowed("isNot"), Field(() => Boolean, { nullable: true }))
    @IsBoolean()
    @IsOptional()
    isNot?: boolean | null;

    @SkipIf(isNotAllowed("eq"), Field(() => fieldType, { nullable: true }))
    @IsUndefined()
    @TransformerType(() => FieldType)
    eq?: T;

    @SkipIf(isNotAllowed("neq"), Field(() => fieldType, { nullable: true }))
    @IsUndefined()
    @TransformerType(() => FieldType)
    neq?: T;

    @SkipIf(isNotAllowed("gt"), Field(() => fieldType, { nullable: true }))
    @IsUndefined()
    @TransformerType(() => FieldType)
    gt?: T;

    @SkipIf(isNotAllowed("gte"), Field(() => fieldType, { nullable: true }))
    @IsUndefined()
    @TransformerType(() => FieldType)
    gte?: T;

    @SkipIf(isNotAllowed("lt"), Field(() => fieldType, { nullable: true }))
    @IsUndefined()
    @TransformerType(() => FieldType)
    lt?: T;

    @SkipIf(isNotAllowed("lte"), Field(() => fieldType, { nullable: true }))
    @IsUndefined()
    @TransformerType(() => FieldType)
    lte?: T;

    @SkipIf(isNotAllowed("like"), Field(() => fieldType, { nullable: true }))
    @IsUndefined()
    @TransformerType(() => FieldType)
    like?: T;

    @SkipIf(isNotAllowed("notLike"), Field(() => fieldType, { nullable: true }))
    @IsUndefined()
    @TransformerType(() => FieldType)
    notLike?: T;

    @SkipIf(isNotAllowed("iLike"), Field(() => fieldType, { nullable: true }))
    @IsUndefined()
    @TransformerType(() => FieldType)
    iLike?: T;

    @SkipIf(
      isNotAllowed("notILike"),
      Field(() => fieldType, { nullable: true })
    )
    @IsUndefined()
    @TransformerType(() => FieldType)
    notILike?: T;

    @SkipIf(isNotAllowed("in"), Field(() => [fieldType], { nullable: true }))
    @IsUndefined()
    @TransformerType(() => FieldType)
    in?: T[];

    @SkipIf(isNotAllowed("notIn"), Field(() => [fieldType], { nullable: true }))
    @IsUndefined()
    @TransformerType(() => FieldType)
    notIn?: T[];
  }
  filterComparisonMap.set(inputName, () => Fc);
  return Fc as Type<FilterFieldComparison<T>>;
}
