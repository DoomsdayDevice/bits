import { Float, Int64, UInt32 } from "../common";
import { messageReflector } from "../constants";
import { GMessageInput } from "@bits/core";

/** wrapped for nullables and such */
export function getFieldType(type: any, wrapped = false): string {
  switch (type) {
    case String:
      if (wrapped) return "google.protobuf.StringValue";
      return "string";
    case Date:
      return "google.protobuf.Timestamp";
    case "uint32":
    case UInt32:
      return "uint32";
    case "int32":
      return "int32";
    case "int64":
    case Int64:
      return "int64";
    case "bytes":
      return "bytes";
    case "float":
    case Float:
      return "float";
    case "bool":
    case Boolean:
      if (wrapped) return "google.protobuf.BoolValue";
      return "bool";
    default: {
      if (typeof type === "string") return type;
      const name = messageReflector.get<unknown, GMessageInput>(type)?.name;
      if (!name)
        throw new Error("GRPC: Couldn't find the correct type for field");
      return name;
    }
  }
}
