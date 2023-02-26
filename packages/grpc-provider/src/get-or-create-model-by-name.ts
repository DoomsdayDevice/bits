import { endsWith, lowerFirst, memoize } from "lodash";
import {
  ArgsType,
  createUnionType,
  Field,
  Float,
  InputType,
  Int,
  ObjectType,
  ReturnTypeFuncValue,
} from "@nestjs/graphql";
import { GraphQLUUID } from "graphql-scalars";
import * as CT from "class-transformer";
import { Transform } from "class-transformer";
import { Type } from "@nestjs/common";
import * as protobuf from "protobufjs";
import { GqlEnumCfg, OffsetPagination } from "@bits/graphql";
import { oneOfToPlain, transformToUnion, UnionOpts } from "@bits/backend";
import { getKeys, renameFunc } from "@bits/core";

export class GrpcProtoToGqlConverter {
  private skippedTypeNames: string[];

  private definedTypes: Type[] = [];

  private oneOfUnionOpts: Record<string, UnionOpts> = {};

  constructor(
    private protoPath: string,
    private skippedTypes: Type[],
    private enums: GqlEnumCfg[]
  ) {
    this.skippedTypeNames = skippedTypes.map((t) => t.name);
  }

  /**
   * builds metadata from .proto
   */
  populateGqlModelByGrpcData = (
    Model: Type,
    name: string,
    grpcName: string,
    FieldDecorator = Field,
    skipFields: string[] = []
  ) => {
    skipFields.push("_type");
    const grpcType = this.getGrpcTypeByName(grpcName);

    for (const f of getKeys(grpcType.fields).filter(
      (field) => !skipFields.includes(field.toString())
    )) {
      const fieldName = f.toString();
      const { type, repeated } = grpcType.fields[f];
      const FieldType = this.getFieldType(f, type);
      let oneOf;
      try {
        oneOf = this.getGrpcTypeByName(type).oneofs?.oneOf;
      } catch {
        oneOf = null;
      }
      if (FieldType === Date) {
        CT.Type(() => Date)(Model.prototype, fieldName);
      } else if (oneOf) {
        // CT.Type(() => FieldType as any)(Model.prototype, fieldName);
        const opts = this.oneOfUnionOpts[type];
        if (opts)
          Transform(
            ({ value }) => {
              return transformToUnion(oneOfToPlain(value), opts);
            },
            { toClassOnly: true }
          )(Model.prototype, fieldName);
      } else if (FieldType instanceof Function) {
        CT.Type(() => FieldType)(Model.prototype, fieldName);
      }
      FieldDecorator(() => (repeated ? [FieldType] : FieldType), {
        name: fieldName,
      })(Model.prototype, fieldName);
    }

    renameFunc(Model, name);
  };

  private getFieldType(
    f: string | number,
    typeName: string
  ): ReturnTypeFuncValue {
    if (this.skippedTypeNames.includes(typeName))
      return this.skippedTypes.find((t) => t.name === typeName)!;
    if (f === "id" || endsWith(f.toString(), "Id")) return GraphQLUUID;
    // Convert ListValue
    if (endsWith(typeName, "ListValue")) {
      // grpcType.fields[f];
      const valueTypeName = this.getGrpcTypeByName(typeName).fields.values.type;
      return [this.convertAndPopulateGrpcTypeToGql(valueTypeName)];
    }
    const Scalar = this.getGqlScalarFromGrpcType(typeName);
    if (Scalar) return Scalar;
    // try for enum
    let grpcEnum: protobuf.Enum | null;
    try {
      grpcEnum = this.getEnum(typeName);
      // find among enums
      // return Enum.name;
    } catch {
      grpcEnum = null;
    }

    if (grpcEnum) {
      const foundGqlEnum = this.enums.find((en) => en.name === grpcEnum!.name);
      if (foundGqlEnum) return foundGqlEnum.e;
      throw new Error(`not found gql enum counterpart for ${grpcEnum.name}`);
    }
    return this.convertAndPopulateGrpcTypeToGql(typeName);
    // return this.convertGrpcTypeToGql(grpcType.fields[f].type);
    // if (!FieldType) throw new Error(`Not found type for ${type} of ${name}:${grpcName}`);
  }

  getGrpcTypeByName(name: string) {
    const protoRoot = getProtoRoot(this.protoPath);
    return protoRoot.lookupType(name);
  }

  getEnum(name: string) {
    const protoRoot = getProtoRoot(this.protoPath);
    return protoRoot.lookupEnum(name);
  }

  getGqlScalarFromGrpcType(grpcType: string) {
    if (grpcType === "string") return String;
    if (grpcType === "uint32") return Int;
    if (grpcType === "bool") return Boolean;
    if (grpcType === "float") return Float;
    if (grpcType === "google.protobuf.Timestamp") return Date;
    if (grpcType === "google.protobuf.BoolValue") return Boolean;
    return null;
  }

  convertAndPopulateGrpcTypeToGql(grpcType: string) {
    const Scalar = this.getGqlScalarFromGrpcType(grpcType);
    if (Scalar) return Scalar;

    const oneOf = this.getGrpcTypeByName(grpcType).oneofs?.oneOf;
    if (oneOf) {
      const fieldTypeNames = oneOf.fieldsArray.map((f) => f.type);
      const fieldTypes: Type[] = fieldTypeNames.map((ftn) =>
        this.convertAndPopulateGrpcTypeToGql(ftn as any)
      );

      const baseTypeName = `${fieldTypeNames.join("")}`;

      const discriminatorName = "_type";
      const subTypes = fieldTypes.map((t) => ({ value: t, name: t.name }));

      class BaseClass {}

      this.oneOfUnionOpts[grpcType] = {
        discriminator: {
          property: discriminatorName,
          subTypes,
        },
        keepDiscriminatorProperty: true,
      }; // CT.Type(() => BaseClass, );
      return getOrCreateUnionType(grpcType, fieldTypes);
    }

    const existing = this.definedTypes.find((t) => t.name === grpcType);
    if (existing) return existing;

    const Model = getOrCreateModelByName(grpcType);
    this.populateGqlModelByGrpcData(Model, grpcType, grpcType, Field);
    this.definedTypes.push(Model);
    return Model;

    // throw new Error(`Proto type ${grpcType} not specified`);
  }

  convertInputTypeToGql(name: string) {
    const Input = getOrCreateInputByName(name);

    const grpcType = this.getGrpcTypeByName(name);
    const skipFields = ["paging", "userId"];
    const keys = getKeys(grpcType.fields);
    const paging = keys.find((f) => f.toString() === "paging");
    const withUser = keys.find((f) => f.toString() === "userId");
    const numOfFields = getKeys(grpcType.fields).filter(
      (field) => !skipFields.includes(field.toString())
    ).length;
    if (numOfFields > 0)
      this.populateGqlModelByGrpcData(Input, name, name, undefined, skipFields);

    @ArgsType()
    class Args {}

    if (paging)
      Field(() => OffsetPagination, { nullable: true })(
        Args.prototype,
        "paging"
      );
    if (numOfFields > 0) Field(() => Input)(Args.prototype, "input");

    return [Args, withUser, paging];
  }
}

/**
 * gives out the model
 */
export const getOrCreateModelByName = memoize(<T extends string>(name: T) => {
  // if already exists in metadata
  @ObjectType(name)
  class Model {}
  return Model;
});

export const getOrCreateInputByName = memoize(<T extends string>(name: T) => {
  @InputType(name)
  class InputDto {}
  return InputDto;
});

export const getOrCreateUnionType = memoize((name: string, models: Type[]) =>
  createUnionType({
    name,
    types: () => models,
  })
);

export const getProtoRoot = (protoPath: string) => protobuf.loadSync(protoPath);

export function getServiceFromModelName(modelName: string, protoPath: string) {
  const protoRoot = getProtoRoot(protoPath);
  protoRoot.lookupService(`${lowerFirst(modelName)}Service`);
}
