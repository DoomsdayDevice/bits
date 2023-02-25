import { Type } from '@nestjs/common';
import { GqlRelation } from './relation/relation.decorator';
import { getOrCreateModelByName } from './gql-crud/get-or-create-model-by-name';
import { RelConf } from './gql-crud/crud-config.interface';

export const buildRelationsForModel = (ModelOrName: Type | string, relations: RelConf[]) => {
  const Model = typeof ModelOrName === 'string' ? getOrCreateModelByName(ModelOrName) : ModelOrName;
  for (const r of relations) {
    const { relatedEntityByName, relatedEntity } = r;
    if (relatedEntity) GqlRelation(() => relatedEntity)(Model.prototype, r.fieldName);
    if (relatedEntityByName)
      GqlRelation(() => getOrCreateModelByName(relatedEntityByName))(Model.prototype, r.fieldName);
  }
};
