import { FilterableRelation } from '@nestjs-query/query-graphql';
import {
  RelationClassDecorator,
  RelationDecoratorOpts,
  RelationTypeFunc,
} from '@nestjs-query/query-graphql/dist/src/decorators/relation.decorator';

export function GqlRelation<DTO, Relation>(
  name: string,
  relationTypeFunc: RelationTypeFunc<Relation>,
  options?: RelationDecoratorOpts<Relation>,
): RelationClassDecorator<DTO> {
  return FilterableRelation(name, relationTypeFunc, options);
}
