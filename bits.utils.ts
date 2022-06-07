// eslint-disable-next-line
import * as _ from 'lodash';
import { Transform, TransformFnParams } from 'class-transformer';

export function renameFunc(func: Function, newName: string): any {
  Object.defineProperty(func, 'name', { value: newName });
}

export function createEnumFromArr<T extends string>(o: readonly T[]): { [K in T]: K } {
  return o.reduce((res, key) => {
    res[key] = key;
    return res;
  }, Object.create(null));
}

export function getPlural(modelName: string) {
  if (modelName[modelName.length - 1] === 'y')
    return `${_.camelCase(modelName.slice(0, modelName.length - 1))}ies`;
  return `${_.camelCase(modelName)}s`;
}

export function getSingular(modelName: string) {
  return `${_.camelCase(modelName)}`;
}

export const RemoveTrailingSpace = () => Transform(({ value }: TransformFnParams) => value?.trim());

/*
 тэг для подсвечивания sql кода в IDE
 ничего не делает
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function sql(t: any, ...a: any[]) {
  const o = [t[0]];
  // eslint-disable-next-line prefer-rest-params
  for (let i = 1, l = arguments.length; i < l; i++) o.push(arguments[i], t[i]);
  return o.join('');
}
