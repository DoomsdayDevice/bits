import {
  RelationClassDecorator,
  RelationDecoratorOpts,
  RelationTypeFunc,
} from './relation/relation.interface';
import { FilterableRelation } from './relation/relation.decorator';

export function GqlRelation<DTO, Relation>(
  name: string,
  relationTypeFunc: RelationTypeFunc<Relation>,
  options?: RelationDecoratorOpts<Relation>,
): RelationClassDecorator<DTO> {
  return FilterableRelation(name, relationTypeFunc, options);
}
