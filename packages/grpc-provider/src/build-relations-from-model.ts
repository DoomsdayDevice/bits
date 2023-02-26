import { GqlRelation, RelConf } from "@bits/graphql";
import { Class } from "@bits/core";
import { getOrCreateModelByName } from "./get-or-create-model-by-name";

export const buildRelationsForModel = (
  ModelOrName: Class | string,
  relations: RelConf[]
) => {
  const Model =
    typeof ModelOrName === "string"
      ? getOrCreateModelByName(ModelOrName)
      : ModelOrName;
  for (const r of relations) {
    const { relatedEntityByName, relatedEntity } = r;
    if (relatedEntity)
      GqlRelation(() => relatedEntity)(Model.prototype, r.fieldName);
    if (relatedEntityByName)
      GqlRelation(() => getOrCreateModelByName(relatedEntityByName))(
        Model.prototype,
        r.fieldName
      );
  }
};
