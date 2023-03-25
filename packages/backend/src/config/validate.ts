// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
import { Class } from "@bits/core";
import { validateSync } from "class-validator";
import { plainToInstance } from "class-transformer";
import { formatValErrors } from "../utils";

export function validateConfig<Cfg extends Record<string, any>>(
  CfgCls: Class<Cfg>,
  config: Cfg
): Cfg {
  // filter instances of cfg classes
  // const validatedConfig = isPlainObject(config)
  //   ? plainToClass(CfgCls, config, { enableImplicitConversion: true })
  //   : config;
  const validatedConfig = plainToInstance(CfgCls, config, {
    enableImplicitConversion: true,
  });
  const errors = validateSync(validatedConfig, {
    skipMissingProperties: false,
  });

  if (errors.length > 0) {
    throw new Error(formatValErrors(errors));
  }
  return validatedConfig;
}
