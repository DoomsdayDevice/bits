import { Type } from '@nestjs/common';
import { ArrayReflector, getPrototypeChain } from '../../grpc/reflector';
import {
  BaseResolverOptions,
  ConnectionTypeFunc,
  RelationClassDecorator,
  RelationDecoratorOpts,
  RelationDescriptor,
  RelationsOpts,
  RelationTypeFunc,
} from './relation.interface';

const RELATION_KEY = 'GQL_RELATION_KEY';

const mergeArrays = <T>(arr1?: T[], arr2?: T[]): T[] | undefined => {
  if (arr1 || arr2) {
    return [...(arr1 ?? []), ...(arr2 ?? [])];
  }
  return undefined;
};

export const reflector = new ArrayReflector(RELATION_KEY);

function getRelationsDescriptors<DTO>(DTOClass: Type<DTO>): RelationDescriptor<unknown>[] {
  return getPrototypeChain(DTOClass).reduce((relations, cls) => {
    const relationNames = relations.map(t => t.name);
    const metaRelations = reflector.get<unknown, RelationDescriptor<unknown>>(cls) ?? [];
    const inheritedRelations = metaRelations.filter(t => !relationNames.includes(t.name));
    return [...inheritedRelations, ...relations];
  }, [] as RelationDescriptor<unknown>[]);
}

export const mergeBaseResolverOpts = <Into extends BaseResolverOptions>(
  into: Into,
  from: BaseResolverOptions,
): Into => {
  const guards = mergeArrays(from.guards, into.guards);
  const interceptors = mergeArrays(from.interceptors, into.interceptors);
  const pipes = mergeArrays(from.pipes, into.pipes);
  const filters = mergeArrays(from.filters, into.filters);
  const decorators = mergeArrays(from.decorators, into.decorators);
  return { ...into, guards, interceptors, pipes, filters, decorators };
};

function convertRelationsToOpts(
  relations: RelationDescriptor<unknown>[],
  baseOpts?: BaseResolverOptions,
): RelationsOpts {
  const relationOpts: RelationsOpts = {};
  relations.forEach(r => {
    const relationType = r.relationTypeFunc();
    const DTO = Array.isArray(relationType) ? relationType[0] : relationType;
    // TODO remove any, it's a retarded fucking bug
    const opts = mergeBaseResolverOpts({ ...r.relationOpts, DTO } as any, baseOpts ?? {});
    if (r.isMany) {
      relationOpts.many = { ...relationOpts.many, [r.name]: opts };
    } else {
      relationOpts.one = { ...relationOpts.one, [r.name]: opts };
    }
  });
  return relationOpts;
}

export function getRelations<DTO>(DTOClass: Type<DTO>, opts?: any): RelationsOpts {
  const relationDescriptors = getRelationsDescriptors(DTOClass);
  return convertRelationsToOpts(relationDescriptors, opts);
}

export function getRelationNames<DTO>(DTOCls: Type<DTO>): (keyof DTO)[] {
  const opts = getRelations(DTOCls);
  const { one, many } = opts;

  const rels = Object.keys({ ...one, ...many });
  return rels as any;
}

/*
export function Rel<DTO, Relation>(
  name: string,
  relationTypeFunc: RelationTypeFunc<Relation>,
  options?: RelationDecoratorOpts<Relation>,
): RelationClassDecorator<DTO> {
  return <Cls extends Type<DTO>>(DTOClass: Cls): Cls | void => {
    const isMany = Array.isArray(relationTypeFunc());
    const relationOpts = isMany ? { pagingStrategy: 'offset', ...options } : options;
    reflector.append(DTOClass, { name, isMany, relationOpts, relationTypeFunc });
    return DTOClass;
  };
}

 */

export function GqlRelation<DTO extends Object, Relation>(
  relationTypeFunc: RelationTypeFunc<Relation>,
  options?: RelationDecoratorOpts<Relation>,
) {
  return <Cls extends Type<DTO>>(dto: DTO, name: string): void => {
    const DTOClass = dto.constructor;
    const isMany = Array.isArray(relationTypeFunc());
    const relationOpts = isMany ? { pagingStrategy: 'offset', ...options } : options;
    // Field(relationTypeFunc)(dto, name);
    reflector.append(DTOClass as Type<DTO>, { name, isMany, relationOpts, relationTypeFunc });
  };
}

export function FilterableGqlRelation<DTO extends Type<unknown>, Relation>(
  relationTypeFunc: RelationTypeFunc<Relation>,
  options?: RelationDecoratorOpts<Relation>,
) {
  return GqlRelation<DTO, Relation>(relationTypeFunc, { ...options, allowFiltering: true });
}

/*
export function FilterableRelation<DTO, Relation>(
  name: string,
  relationTypeFunc: RelationTypeFunc<Relation>,
  options?: RelationDecoratorOpts<Relation>,
): RelationClassDecorator<DTO> {
  return Rel<DTO, Relation>(name, relationTypeFunc, { ...options, allowFiltering: true });
}

 */

export function Connection<DTO, Relation>(
  name: string,
  relationTypeFunc: ConnectionTypeFunc<Relation>,
  options?: RelationDecoratorOpts<Relation>,
): RelationClassDecorator<DTO> {
  return <Cls extends Type<DTO>>(DTOClass: Cls): Cls | void => {
    reflector.append(DTOClass, { name, isMany: true, relationOpts: options, relationTypeFunc });
    return DTOClass;
  };
}

export function FilterableConnection<DTO, Relation>(
  name: string,
  relationTypeFunc: ConnectionTypeFunc<Relation>,
  options?: RelationDecoratorOpts<Relation>,
): RelationClassDecorator<DTO> {
  return Connection<DTO, Relation>(name, relationTypeFunc, { ...options, allowFiltering: true });
}
