import { memoize, upperFirst } from "lodash";
import { Type } from "@nestjs/common";
import { GrpcFieldDef, GrpcMessageDef } from "./index";

export const getListValueOfCls = memoize(<T>(Cls: Type<T> | string) => {
  const name = upperFirst((Cls as any).name || Cls);
  @GrpcMessageDef({ name: `${name}ListValue` })
  class InArray {
    @GrpcFieldDef(() => [Cls] as any)
    values!: T[];
  }

  return InArray;
});
