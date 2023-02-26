export interface IFindOneOptions<E> {
  where?: IFindOptionsWhere<E>[] | IFindOptionsWhere<E>;

  relations?: IFindOptionsRelations<E> | IFindOptionsRelationByString;

  order?: IFindOptionsOrder<E>;

  withDeleted?: boolean;
}

export type IFindOptionsWhere<E> = {
  [P in keyof E]?: P extends "toString"
    ? unknown
    : IFindOptionsWhereProperty<NonNullable<E[P]>>;
};

export type IFindOptionsWhereProperty<Property> = Property extends Promise<
  infer I
>
  ? IFindOptionsWhereProperty<NonNullable<I>>
  : Property extends Array<infer I>
  ? IFindOptionsWhereProperty<NonNullable<I>>
  : Property extends Function
  ? never
  : Property extends Buffer
  ? Property | IFindOperator<Property>
  : Property extends Date
  ? Property | IFindOperator<Property>
  : Property extends object
  ?
      | IFindOptionsWhere<Property>
      | IFindOptionsWhere<Property>[]
      | IEqualOperator<Property>
      | IFindOperator<any>
      | boolean
  : Property | IFindOperator<Property>;

export type FindOperatorType =
  | "not"
  | "lessThan"
  | "lessThanOrEqual"
  | "moreThan"
  | "moreThanOrEqual"
  | "equal"
  | "between"
  | "in"
  | "any"
  | "isNull"
  | "ilike"
  | "like"
  | "raw"
  | "arrayContains"
  | "arrayContainedBy"
  | "arrayOverlap";

export type IFindOperator<T> = {
  value: T;
};
export interface IEqualOperator<T> extends IFindOperator<T> {}

export type IFindOptionsOrderValue =
  | "ASC"
  | "DESC"
  | "asc"
  | "desc"
  | 1
  | -1
  | {
      direction?: "asc" | "desc" | "ASC" | "DESC";
      nulls?: "first" | "last" | "FIRST" | "LAST";
    };

export type IFindOptionsOrderProperty<Property> = Property extends Promise<
  infer I
>
  ? IFindOptionsOrderProperty<NonNullable<I>>
  : Property extends Array<infer I>
  ? IFindOptionsOrderProperty<NonNullable<I>>
  : Property extends Function
  ? never
  : Property extends Buffer
  ? IFindOptionsOrderValue
  : Property extends Date
  ? IFindOptionsOrderValue
  : Property extends object
  ? IFindOptionsOrder<Property>
  : IFindOptionsOrderValue;

export type IFindOptionsOrder<Entity> = {
  [P in keyof Entity]?: P extends "toString"
    ? unknown
    : IFindOptionsOrderProperty<NonNullable<Entity[P]>>;
};

export type IFindOptionsRelations<Entity> = {
  [P in keyof Entity]?: P extends "toString"
    ? unknown
    : IFindOptionsRelationsProperty<NonNullable<Entity[P]>>;
};

export type IFindOptionsRelationsProperty<Property> = Property extends Promise<
  infer I
>
  ? IFindOptionsRelationsProperty<NonNullable<I>> | boolean
  : Property extends Array<infer I>
  ? IFindOptionsRelationsProperty<NonNullable<I>> | boolean
  : Property extends Function
  ? never
  : Property extends Buffer
  ? never
  : Property extends Date
  ? never
  : Property extends object
  ? IFindOptionsRelations<Property> | boolean
  : boolean;
export type IFindOptionsRelationByString = string[];

export interface IFindManyOptions<E = any> extends IFindOneOptions<E> {
  /**
   * Offset (paginated) where from entities should be taken.
   */
  skip?: number;
  /**
   * Limit (paginated) - max number of entities should be taken.
   */
  take?: number;
}
