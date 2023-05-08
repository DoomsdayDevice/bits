import { SimpleReadableRepoMixin } from "./simple-readable.repo";
import { ObjectLiteral } from "typeorm";
import { Class } from "@bits/core";

export const getGenericReadRepo = <Entity extends ObjectLiteral>(
  classRef: Class<Entity>
) => SimpleReadableRepoMixin(classRef);
