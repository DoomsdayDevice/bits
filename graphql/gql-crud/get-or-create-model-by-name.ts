import { endsWith, lowerFirst, memoize } from 'lodash';
import {
  createUnionType,
  Field,
  Float,
  InputType,
  Int,
  ObjectType,
  ReturnTypeFuncValue,
} from '@nestjs/graphql';
import { getKeys, renameFunc } from '@bits/bits.utils';
import { GraphQLUUID } from 'graphql-scalars';
import * as CT from 'class-transformer';
import { Type } from '@nestjs/common';
import * as protobuf from 'protobufjs';
import { GqlEnum } from '@core/graphql/enums';

export class GrpcProtoToGqlConverter {
  private skippedTypeNames: string[];

  private definedTypes: Type[] = [];

  constructor(private protoPath: string, private skippedTypes: Type[], private enums: GqlEnum[]) {
    this.skippedTypeNames = skippedTypes.map(t => t.name);
  }

  /**
   * builds metadata from .proto
   */
  populateGqlModelByGrpcData = (
    Model: Type,
    name: string,
    grpcName: string,
    FieldDecorator = Field,
  ) => {
    const grpcType = this.getGrpcTypeByName(grpcName);

    for (const f of getKeys(grpcType.fields)) {
      const { type } = grpcType.fields[f];
      const FieldType = this.getFieldType(f, type);
      if (FieldType === Date) {
        CT.Type(() => Date)(Model.prototype, f as string);
      }
      const T = typeof FieldType === 'string' ? FieldType : () => FieldType;
      FieldDecorator(T, { name: f.toString() })(Model.prototype, f.toString());
    }

    renameFunc(Model, name);
  };

  private getFieldType(f: string | number, typeName: string): ReturnTypeFuncValue {
    if (this.skippedTypeNames.includes(typeName))
      return this.skippedTypes.find(t => t.name === typeName)!;
    if (f === 'id' || endsWith(f.toString(), 'Id')) return GraphQLUUID;
    // Convert ListValue
    if (endsWith(typeName, 'ListValue')) {
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
      console.warn(`Not found type for ${typeName}`);
    }

    if (grpcEnum) {
      const foundGqlEnum = this.enums.find(en => en.name === grpcEnum!.name);
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
    if (grpcType === 'string') return String;
    if (grpcType === 'uint32') return Int;
    if (grpcType === 'bool') return Boolean;
    if (grpcType === 'float') return Float;
    if (grpcType === 'google.protobuf.Timestamp') return Date;
    if (grpcType === 'google.protobuf.BoolValue') return Boolean;
    console.warn(`grpc type ${grpcType} not scalar`);
    return null;
  }

  convertAndPopulateGrpcTypeToGql(grpcType: string) {
    const Scalar = this.getGqlScalarFromGrpcType(grpcType);
    if (Scalar) return Scalar;

    const oneOf = this.getGrpcTypeByName(grpcType).oneofs?.oneOf;
    if (oneOf) {
      const fieldTypeNames = oneOf.fieldsArray.map(f => f.type);
      const fieldTypes: Type[] = fieldTypeNames.map(ftn =>
        this.convertAndPopulateGrpcTypeToGql(ftn as any),
      );
      return getOrCreateUnionType(grpcType, fieldTypes);
    }

    const existing = this.definedTypes.find(t => t.name === grpcType);
    if (existing) return existing;

    const Model = getOrCreateModelByName(grpcType);
    this.populateGqlModelByGrpcData(Model, grpcType, grpcType, Field);
    this.definedTypes.push(Model);
    return Model;

    // throw new Error(`Proto type ${grpcType} not specified`);
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

export const getOrCreateUnionType = memoize((name: string, models: Type[]) => {
  return createUnionType({
    name,
    types: () => models,
  });
});

export const getProtoRoot = (protoPath: string) => {
  return protobuf.loadSync(protoPath);
};

// export const protoRoot = protobuf.loadSync();

export function getServiceFromModelName(modelName: string, protoPath: string) {
  const protoRoot = getProtoRoot(protoPath);
  protoRoot.lookupService(`${lowerFirst(modelName)}Service`);
}
