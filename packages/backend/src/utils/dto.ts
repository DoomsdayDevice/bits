import { validateSync, ValidationError } from "class-validator";
import { Type } from "@nestjs/common";
import { plainToInstance } from "class-transformer";
import { getKeys } from "@bits/core";

function valErrorToStr(
  err: ValidationError,
  printClass = true,
  shouldDecorate = false,
  hasParent = false,
  parentPath = ``
): string {
  const boldStart = shouldDecorate ? `\x1b[1m` : ``;
  const boldEnd = shouldDecorate ? `\x1b[22m` : ``;

  // const boldEnd = shouldDecorate ? `\x1b[22m` : ``;
  const propConstraintFailed = (propertyName: string): string =>
    ` - поле ${boldStart}${parentPath}${propertyName}${boldEnd}: ${boldStart}${Object.keys(
      err.constraints as any
    )
      .map((k) => `${err.constraints![k]}`)
      .join(`,`)}${boldEnd} \n`;

  if (!hasParent) {
    return (
      (printClass
        ? `В объекте класса ${boldStart}${
            err.target ? err.target.constructor.name : "Object"
          }${boldEnd} не пройдена валидация:\n`
        : "") +
      (err.constraints ? propConstraintFailed(err.property) : ``) +
      (err.children
        ? err.children
            .map((childError) =>
              valErrorToStr(
                childError,
                false,
                shouldDecorate,
                true,
                err.property
              )
            )
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
        .map((childError) =>
          valErrorToStr(
            childError,
            false,
            shouldDecorate,
            true,
            `${parentPath}${formattedProperty}`
          )
        )
        .join(``)
    : ``;
}

/** для кортежей типа [number, string, MyType] */
export function transformAndValidateArraySync<T extends Record<string, any>>(
  Model: Type<T>,
  array: any[]
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

export function transformAndValidate<T extends Record<string, any>>(
  Model: Type<T>,
  object: T
): T;
export function transformAndValidate<T extends Record<string, any>>(
  Model: Type<T>,
  arr: T[]
): T[];
export function transformAndValidate<T extends Record<string, any>>(
  Model: Type<T>,
  object: T | T[]
): T | T[] {
  const inst = plainToInstance(Model, object, {
    enableImplicitConversion: true,
  });

  const valErrors = validateSync(inst);
  if (valErrors.length > 0) {
    throw new Error(formatValErrors(valErrors));
  }
  return inst;
}

function isPlainObject(obj: any) {
  const prototype = Object.getPrototypeOf(obj);
  return prototype === null || prototype.constructor === Object;
}

export function formatValErrors(errors: ValidationError[]): string {
  return errors.map((e, i) => valErrorToStr(e, i === 0)).join("");
}

const plainToUnion = <T extends object>(v: T, opts: UnionOpts) => {
  const realTargetType: Type = opts.discriminator.subTypes.find(
    (subType) => subType.name === (v as any)[opts.discriminator.property]
  )!.value;
  return plainToInstance(realTargetType, v);
  // if (!targetType.options.keepDiscriminatorProperty)
  //   delete subValue[targetType.options.discriminator.property];
};

export const oneOfToPlain = (value: any) => {
  let transformed;
  if (Array.isArray(value)) {
    const keys = getKeys(value[0]);
    const whichOne = keys.find((k) => value[0][k])!;
    transformed = value.map((v) => v[whichOne]);
  } else {
    const keys = getKeys(value);
    const whichOne = keys.find((k) => value[k])!;
    transformed = value[whichOne];
  }
  return transformed;
};

export const transformToUnion = <T extends object>(
  valOrVals: T | T[],
  opts: UnionOpts
) => {
  if (Array.isArray(valOrVals)) {
    return valOrVals.map((v) => plainToUnion(v, opts));
  }
  return plainToUnion(valOrVals, opts);
};

export type UnionOpts = {
  discriminator: {
    property: string;
    subTypes: { value: Type; name: string }[];
  };
  keepDiscriminatorProperty: boolean;
};
