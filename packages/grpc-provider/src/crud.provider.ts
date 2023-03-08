import { ICrudModuleProvider, ICrudService, RelConf } from "@bits/backend";
import { Class, IGrpcService, ObjectLiteral } from "@bits/core";
import { getOrCreateDefaultGrpcCrudServiceWrapper } from "./generic-grpc-crud-wrapper.service";
import {
  getOrCreateInputByName,
  getOrCreateModelByName,
  GrpcProtoToGqlConverter,
} from "./get-or-create-model-by-name";
import { buildRelationsForModel } from "./build-relations-from-model";
import { FilterableField } from "@bits/graphql";

type CfgBase = {
  grpcServiceName?: string;
  converter: GrpcProtoToGqlConverter;
};

type Cfg = CfgBase &
  ({ Model: Class; modelName?: string } | { modelName: string });

export class GrpcProvider<T extends ObjectLiteral>
  implements ICrudModuleProvider<T>
{
  private grpcServiceName: string;
  private modelName: string;

  constructor(private cfg: Cfg) {
    this.modelName =
      "Model" in cfg
        ? cfg.modelName
          ? cfg.modelName
          : cfg.Model.name
        : cfg.modelName;
    this.grpcServiceName = cfg.grpcServiceName || `${this.modelName}Service`;
  }

  getImports() {
    return [];
  }

  buildService(): Class<ICrudService<T>> {
    return getOrCreateDefaultGrpcCrudServiceWrapper<
      IGrpcService<unknown>,
      any,
      T
    >({
      packageToken: "CORE_PACKAGE",
      DTOCls:
        "Model" in this.cfg
          ? this.cfg.Model
          : getOrCreateModelByName(this.modelName),
      serviceName: this.grpcServiceName,
    });
  }

  buildModelFromName(
    name: string,
    grpcName = name,
    type: "input" | "object" = "object",
    relations: RelConf[] = []
  ): Class {
    const fn =
      type === "object" ? getOrCreateModelByName : getOrCreateInputByName;
    // get fields

    const Model = fn(name);
    this.cfg.converter.populateGqlModelByGrpcData(
      Model,
      name,
      grpcName,
      FilterableField
    );

    // Build specified in config relations
    if (relations.length) buildRelationsForModel(Model, relations);
    // for (const r of this.relations) {
    // const { relatedEntityByName, relatedEntity } = r;
    // if (relatedEntity) GqlRelation(() => relatedEntity)(Model.prototype, r.fieldName);
    // if (relatedEntityByName)
    //   GqlRelation(() => getModelFn(relatedEntityByName))(Model.prototype, r.fieldName);
    // }

    return Model;
  }
}
