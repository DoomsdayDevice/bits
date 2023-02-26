import { get, set } from 'lodash';

function escape(propertyName: string) {
  return propertyName.replace(/\\/g, '\\\\').replace(/\./g, '\\.');
}

function unescapeAndSplit(originalPath: string) {
  const properties: string[] = [];
  let path = originalPath;
  let i = path.indexOf('.');
  while (i >= 0) {
    if (isEscapedDot(path, i)) {
      path = unescapeFirstDotChar(path);
      // Find the index of the first dot AFTER the one we just unescaped
      i = path.indexOf('.', i);
    } else {
      const firstProperty = path.substring(0, i);
      properties.push(unescapeEscapeChars(firstProperty));
      path = path.substring(i + 1);
      i = path.indexOf('.');
    }
  }

  properties.push(unescapeEscapeChars(path));
  return properties;
}

function unescapeFirstDotChar(str: string) {
  return str.replace('\\.', '.');
}

function unescapeEscapeChars(str: string) {
  return str.replace(/\\\\/g, '\\');
}

function isEscapedDot(path: string, i: number) {
  let counter = 0;
  while (path.substring(i - 1, i) === '\\') {
    counter++;
    i--;
  }

  return counter % 2 === 1;
}

/**
 * Creates a new object that copies fields present in field mask from specified source object
 * @param {*} sourceObject - object to apply field mask to
 * @param {string[]} fieldMask
 * @returns {*} - new object created by applying field mask on source object or original entity if source is not an object
 */
export function applyFieldMask(sourceObject: any, fieldMask: string[]) {
  if (!isObject(sourceObject)) {
    return sourceObject;
  }
  const result = {};

  for (let i = 0; i < fieldMask.length; i++) {
    const path = unescapeAndSplit(fieldMask[i]);
    const sourceValue = get(sourceObject, path);
    set(result, path, sourceValue === undefined ? null : sourceValue);
  }

  return result;
}

/**
 * Generates field mask that includes all non-function own properties on specified object
 * @param {*} object - object to generate field mask from
 * @returns {string[]} - generated field mask
 */
export function generateFieldMask(object: any) {
  const paths: string[] = [];
  if (!isObject(object)) {
    return paths;
  }

  const pathBuilder = '';
  generatePathForObject(object, pathBuilder, paths);
  return paths;
}

function generatePathForObject(object: Record<string, any>, path: string, paths: string[]) {
  for (const key of Object.keys(object)) {
    // eslint-disable-next-line no-prototype-builtins
    if (object.hasOwnProperty(key)) {
      let expandedPath = path.length > 0 ? `${path}.` : path;
      expandedPath += escape(key);

      const objProperty = object[key];
      if (isObject(objProperty) && !Array.isArray(objProperty) && !(objProperty instanceof Date)) {
        generatePathForObject(objProperty, expandedPath, paths);
      } else if (!isFunction(objProperty)) {
        paths.push(expandedPath);
      }
    }
  }
}

function isObject(object: any) {
  return typeof object === 'object' && object !== null;
}

function isFunction(object: any) {
  return typeof object === 'function';
}
