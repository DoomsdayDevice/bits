import { validateSync, ValidationError } from 'class-validator';
import { plainToClass, plainToInstance } from 'class-transformer';
import { Type } from '@nestjs/common';
import { Cfg } from '../../config/config.dto';

export function formatValErrors(errors: ValidationError[]): string {
  return errors.map((e, i) => valErrorToStr(e, i === 0)).join('');
}

// eslint-disable-next-line
export function renameFunc(func: Function, newName: string): any {
  Object.defineProperty(func, 'name', { value: newName });
}

function valErrorToStr(
  err: ValidationError,
  printClass = true,
  shouldDecorate = false,
  hasParent = false,
  parentPath = ``,
): string {
  const boldStart = shouldDecorate ? `\x1b[1m` : ``;
  const boldEnd = shouldDecorate ? `\x1b[22m` : ``;

  // const boldEnd = shouldDecorate ? `\x1b[22m` : ``;
  const propConstraintFailed = (propertyName: string): string =>
    ` - поле ${boldStart}${parentPath}${propertyName}${boldEnd}: ${boldStart}${Object.keys(
      err.constraints as any,
    )
      .map(k => `${err.constraints![k]}`)
      .join(`,`)}${boldEnd} \n`;

  if (!hasParent) {
    return (
      (printClass
        ? `В объекте класса ${boldStart}${
            err.target ? err.target.constructor.name : 'Object'
          }${boldEnd} не пройдена валидация:\n`
        : '') +
      (err.constraints ? propConstraintFailed(err.property) : ``) +
      (err.children
        ? err.children
            .map(childError => valErrorToStr(childError, false, shouldDecorate, true, err.property))
            .join(``)
        : ``)
    );
  }
  // we format numbers as array indexes for better readability.
  const formattedProperty = Number.isInteger(+err.property)
    ? `[${err.property}]`
    : `${parentPath ? `.` : ``}${err.property}`;

  if (err.constraints) return propConstraintFailed(formattedProperty);
  return err.children
    ? err.children
        .map(childError =>
          valErrorToStr(
            childError,
            false,
            shouldDecorate,
            true,
            `${parentPath}${formattedProperty}`,
          ),
        )
        .join(``)
    : ``;
}

export function transformAndValidateArraySync<T extends Record<string, any>>(
  array: any[],
  Model: Type<T>,
): T {
  // replace undefined with null for cases like excelJS
  for (let i = 0; i < array.length; i++) {
    if (array[i] === undefined) array[i] = null;
  }

  const transformed = plainToInstance(Model, { ...array } as any, {
    enableImplicitConversion: true,
  });
  const valErrors = validateSync(transformed);

  if (valErrors.length > 0) {
    throw new Error(formatValErrors(valErrors));
  }
  return transformed;
}

export function transformAndValidate<T extends Record<string, any>>(Model: Type<T>, object: T): T {
  const inst = plainToInstance(Model, object);

  const valErrors = validateSync(inst);
  if (valErrors.length > 0) {
    throw new Error(formatValErrors(valErrors));
  }
  return inst;
}

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export function validateConfig(config: Cfg): Cfg {
  const validatedConfig = plainToClass(Cfg, config, { enableImplicitConversion: true });
  const errors = validateSync(validatedConfig, { skipMissingProperties: false });

  if (errors.length > 0) {
    throw new Error(formatValErrors(errors));
  }
  return validatedConfig;
}

export function createEnumFromArr<T extends string>(o: readonly T[]): { [K in T]: K } {
  return o.reduce((res, key) => {
    res[key] = key;
    return res;
  }, Object.create(null));
}
