type BuiltInTypes =
  | boolean
  | string
  | number
  | Date
  | RegExp
  | bigint
  | symbol
  | null
  | undefined
  | never;

export interface CommonFieldComparisonType<T> {
  eq: T;
}

export interface StringListValue {
  values: string[];
}

/**
 * for wrapped grpc services
 */
export type GWrapperStringFieldComparison =
  | {
      in: StringListValue;
    }
  | { eq: string };

/**
 * for raw grpc services
 */
export type GStringFieldComparison =
  | {
      in: StringListValue;
    }
  | {
      eq: string;
    }
  | {
      like: string;
    }
  | {
      iLike: string;
    };

export type BooleanFieldComparisons = { eq: boolean };

type FilterFieldComparison<FieldType, IsKeys extends true | false> = FieldType extends
  | string
  | String
  ? GStringFieldComparison // eslint-disable-next-line @typescript-eslint/ban-types
  : FieldType extends boolean | Boolean
  ? BooleanFieldComparisons
  : FieldType extends null | undefined | never
  ? never // eslint-disable-next-line @typescript-eslint/no-explicit-any
  : FieldType extends number | Date | RegExp | bigint | BuiltInTypes[] | symbol
  ? CommonFieldComparisonType<FieldType>
  : FieldType extends Array<infer U>
  ? CommonFieldComparisonType<U> | IGrpcFilter<U> // eslint-disable-next-line @typescript-eslint/ban-types
  : IsKeys extends true
  ? CommonFieldComparisonType<FieldType> & GStringFieldComparison & IGrpcFilter<FieldType>
  : CommonFieldComparisonType<FieldType> | IGrpcFilter<FieldType>;

export type FilterComparisons<T> = {
  [K in keyof T]?: FilterFieldComparison<T[K], false>;
};

export type IGrpcFilter<M> = FilterComparisons<M>;
