import { Class } from "@bits/core";
import { Action } from "./enums/action.enum";
import { DynamicModule, ForwardReference } from "@nestjs/common";

export type ModuleImportElem =
  | Class
  | DynamicModule
  | Promise<DynamicModule>
  | ForwardReference;
export type Privilege<ResourceName extends string> = [
  ResourceName | string,
  Action
];

export interface RelConf {
  idFieldName: string;
  fieldName: string;
  relatedEntity?: Class;
  relatedEntityByName?: string;
}

export interface ICrudModuleProvider<M> {
  buildService(): any;
  getImports(
    modelRef: Class<M>
  ): Array<
    Class<any> | DynamicModule | Promise<DynamicModule> | ForwardReference
  >;
  buildModelFromName(
    name: string,
    innerName?: string,
    type?: "input" | "object",
    relations?: RelConf[]
  ): Class<M>;
}
