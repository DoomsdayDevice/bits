import { ObjectLiteral } from '../types';

export * from './field-mask.utils';

// eslint-disable-next-line
import * as _ from 'lodash';
import { clone, isObject, isUndefined } from 'lodash';

export function renameFunc(func: Function, newName: string): any {
  Object.defineProperty(func, 'name', { value: newName });
}

export function createEnumFromArr<T extends string>(o: readonly T[]): { [K in T]: K } {
  return o.reduce((res, key) => {
    res[key] = key;
    return res;
  }, Object.create(null));
}

export const isDefined = <T>(v: T): v is Exclude<T, undefined | null> =>
  v !== null && v !== undefined;

export function hasDefined<O extends ObjectLiteral, PN extends string>(obj: O, prop: PN) {
  return prop in obj && !isUndefined(obj[prop]);
}

export function getPlural(modelName: string) {
  if (modelName[modelName.length - 1] === 'y')
    return `${_.camelCase(modelName.slice(0, modelName.length - 1))}ies`;
  return `${_.camelCase(modelName)}s`;
}

export function getSingular(modelName: string) {
  return `${_.camelCase(modelName)}`;
}

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

/** deep rename fields in object */
export function renameKeyNames(obj: any, nameMap: any) {
  const clonedObj = clone(obj);
  const oldNames = Object.keys(nameMap);

  for (const key of Object.keys(clonedObj)) {
    if (isObject(clonedObj[key])) {
      clonedObj[key] = renameKeyNames(clonedObj[key], nameMap);
    }
    if (oldNames.includes(key)) {
      const val = clonedObj[key];
      const newName = nameMap[key];
      clonedObj[newName] = val;
      delete clonedObj[key];
    }
  }

  return clonedObj;
}

export const getKeys = <T extends object>(obj: T) => Object.keys(obj) as (keyof T)[];

export function lowercaseFirstLetter(str: string): string {
  return str[0].toLowerCase() + str.slice(1);
}

export function capitalizeFirstLetter(str: string): string {
  return str[0].toUpperCase() + str.slice(1);
}

type EnsureOrderOpts = {
  docs: any[];
  keys: readonly string[] | string[];
  prop: string;
  error?: (key: string) => string;
};

export const ensureOrder = (options: EnsureOrderOpts) => {
  const { docs, keys, prop, error = (key: string) => `Document does not exist (${key})` } = options;
  // Put documents (docs) into a map where key is a document's ID or some
  // property (prop) of a document and value is a document.
  const docsMap = new Map();
  docs.forEach(doc => docsMap.set(doc[prop], doc));
  // Loop through the keys and for each one retrieve proper document. For not
  // existing documents generate an error.
  return keys.map((key: string) => {
    return docsMap.get(key) || new Error(typeof error === 'function' ? error(key) : error);
  });
};
