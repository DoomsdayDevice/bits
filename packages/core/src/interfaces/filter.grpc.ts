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

export interface GrpcCommonFieldComparisonType<T> {
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

export type GrpcCompareComps<T> =
    | {
    lt: T;
}
    | {
    lte: T;
}
    | {
    gt: T;
}
    | {
    gte: T;
};

/**
 * for raw grpc services
 */
export type GrpcStringFieldComparison =
    | GrpcCompareComps<string>
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
}
    | {
    notLike: string;
}
    | {
    notILike: string;
};

export type ArrayComparisonType<T, Enums> = {
    elemMatch: GrpcFilterComparisons<T, Enums>;
};

export type GrpcBooleanFieldComparisons = { is: boolean; isNot: boolean };

type GrpcFilterFieldComparison<
    FieldType,
    IsKeys extends true | false,
    Enums
    > = FieldType extends Enums // expected to be a global type
    ? GrpcCommonFieldComparisonType<FieldType>
    : FieldType extends string | String // eslint-disable-line @typescript-eslint/ban-types
        ? GrpcStringFieldComparison
        : FieldType extends boolean | Boolean // eslint-disable-line @typescript-eslint/ban-types
            ? GrpcBooleanFieldComparisons
            : FieldType extends null | undefined | never
                ? never // eslint-disable-next-line @typescript-eslint/no-explicit-any
                : FieldType extends number | Date | RegExp | bigint | BuiltInTypes[] | symbol
                    ? GrpcCommonFieldComparisonType<FieldType>
                    : FieldType extends Array<infer U>
                        ? ArrayComparisonType<U, Enums> // eslint-disable-next-line @typescript-eslint/ban-types
                        : FieldType extends { values: Array<infer U> }
                            ? ArrayComparisonType<U, Enums>
                            : IsKeys extends true
                                ? GrpcCommonFieldComparisonType<FieldType> & GrpcStringFieldComparison & IGrpcFilter<FieldType, Enums>
                                : GrpcCommonFieldComparisonType<FieldType> | IGrpcFilter<FieldType, Enums>;

export type GrpcFilterComparisons<T, Enums> = {
    [K in keyof T]?: GrpcFilterFieldComparison<T[K], false, Enums>;
};

export type IGrpcFilter<M, Enums> = GrpcFilterComparisons<M, Enums>;
