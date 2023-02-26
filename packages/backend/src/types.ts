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
