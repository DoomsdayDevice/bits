import {
  CanActivate,
  ExceptionFilter,
  NestInterceptor,
  PipeTransform,
  Type,
} from "@nestjs/common";
import { GraphQLCompositeType, GraphQLField } from "graphql";
import { IGqlFilter } from "@bits/core";

export declare type ComplexityEstimatorArgs = {
  type: GraphQLCompositeType;
  field: GraphQLField<any, any>;
  args: {
    [key: string]: any;
  };
  childComplexity: number;
};

export declare type ComplexityEstimator = (
  options: ComplexityEstimatorArgs
) => number | void;
export declare type Complexity = ComplexityEstimator | number;

export interface BaseResolverOptions {
  /** An array of `nestjs` guards to apply to a graphql endpoint */
  guards?: (Type<CanActivate> | CanActivate)[];
  /** An array of `nestjs` interceptors to apply to a graphql endpoint */
  interceptors?: Type<NestInterceptor<any, any>>[];
  /** An array of `nestjs` pipes to apply to a graphql endpoint */
  pipes?: Type<PipeTransform<any, any>>[];
  /** An array of `nestjs` error filters to apply to a graphql endpoint */
  filters?: Type<ExceptionFilter<any>>[];
  /** An array of additional decorators to apply to the graphql endpont * */
  decorators?: (PropertyDecorator | MethodDecorator)[];
}

export type RelationTypeMap<RT> = Record<string, RT>;

export interface ResolverMethodOpts extends BaseResolverOptions {
  /** Set to true to disable the endpoint */
  disabled?: boolean;
}

export type CursorConnectionOptions = {
  enableTotalCount?: boolean;
  connectionName?: string;
  disableKeySetPagination?: boolean;
};

export interface DTONamesOpts {
  dtoName?: string;
}

export type ReferencesKeys<DTO, Reference> = {
  [F in keyof Reference]?: keyof DTO;
};

export interface ResolverRelationReference<DTO, Reference>
  extends DTONamesOpts,
    ResolverMethodOpts {
  /**
   * The class type of the relation.
   */
  DTO: Type<Reference>;

  /**
   * Keys
   */
  keys: ReferencesKeys<DTO, Reference>;

  /**
   * Set to true if the relation is nullable
   */
  nullable?: boolean;

  complexity?: Complexity;
}

export type ResolverRelation<T, Relation> = {
  /**
   * The class type of the relation.
   */
  DTO: Type<Relation>;

  customForeignKey?: {
    ownForeignKey: keyof T;
    referencedKey: keyof Relation;
  };

  manyToManyByArr?: {
    arrayName: keyof T;
    referencedFieldName: keyof Relation;
  };

  manyToManyByRefs?: {
    ownFieldThatIsReferenced: keyof Relation;
    ownIdField: keyof T;
    simplify?: boolean;
  };
  oneToMany?: {
    referencedFieldName: keyof Relation;
    ownPrimaryColName?: keyof T;
  };

  /**
   * The name of the relation to use when fetching from the QueryService
   */
  relationName?: string;
  /**
   * Set to true if the relation is nullable
   */
  nullable?: boolean;
  /**
   * Disable read relation graphql endpoints
   */
  disableRead?: boolean;
  /**
   * Disable update relation graphql endpoints
   */
  disableUpdate?: boolean;
  /**
   * Disable remove relation graphql endpoints
   */
  disableRemove?: boolean;

  /**
   * Enable aggregation queries.
   */
  enableAggregate?: boolean;

  /**
   * Set to true if you should be able to filter on this relation.
   *
   * This will only work with relations defined through an ORM (typeorm or sequelize).
   */
  allowFiltering?: boolean;

  complexity?: Complexity;

  auth?: AuthorizerOptions<Relation>;
} & DTONamesOpts &
  ResolverMethodOpts &
  // QueryArgsTypeOpts<Relation> &
  Pick<CursorConnectionOptions, "enableTotalCount">;

export interface AuthorizerOptions<DTO> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  authorize: (context: any) => IGqlFilter<DTO> | Promise<IGqlFilter<DTO>>;
}

export type RelationsOpts<T> = {
  /**
   * All relations that are a single record
   */
  one?: RelationTypeMap<ResolverRelation<T, unknown>>;
  /**
   * All relations that have multiple records
   */
  many?: RelationTypeMap<ResolverRelation<T, unknown>>;
};

export interface RelationDescriptor<T, Relation> {
  name: string;
  relationTypeFunc: () => Type<Relation> | Type<Relation>[];
  isMany: boolean;
  relationOpts?: RelationsOpts<T>;
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ReferencesOpts<DTO> = RelationTypeMap<
  ResolverRelationReference<DTO, any>
>;

export type RelationDecoratorOpts<T, Relation> = Omit<
  ResolverRelation<T, Relation>,
  "DTO"
>;
export type RelationTypeFunc<Relation> = () =>
  | Type<Relation>
  | Type<Relation>[];
export type ConnectionTypeFunc<Relation> = () => Type<Relation>;
export type RelationClassDecorator<DTO> = <Cls extends Type<DTO>>(
  DTOClass: Cls
) => Cls | void;
export type GqlRelationDecorator<DTO> = <Cls extends Type<DTO>>(
  DTOClass: Cls,
  propertyKey: string
) => void;
