import { FindOperator, FindOptionsWhere, ObjectLiteral, SelectQueryBuilder } from 'typeorm';
import { isObject } from 'lodash';

export function isFindOperator<T>(obj: any): obj is FindOperator<T> {
  return obj._type;
}

export function applyFilterToQueryBuilder<T extends ObjectLiteral>(
  where: FindOptionsWhere<T>,
  qb: SelectQueryBuilder<T>,
) {
  for (const key of Object.keys(where) as (keyof T)[]) {
    if (isObject(key)) applyFilterToQueryBuilder(where[key]!, qb);
    else {
      if (isFindOperator(where[key])) {
        if (where[key]._type === 'in') {
          if (key === 'ids') qb.whereInIds(where[key]);
          else qb.andWhere({ [key]: where[key] });
        }
      } else qb.andWhere({ [key]: where[key] });
    }
  }

  return qb;
}

export const ensureOrder = options => {
  const { docs, keys, prop, error = key => `Document does not exist (${key})` } = options;
  // Put documents (docs) into a map where key is a document's ID or some
  // property (prop) of a document and value is a document.
  const docsMap = new Map();
  docs.forEach(doc => docsMap.set(doc[prop], doc));
  // Loop through the keys and for each one retrieve proper document. For not
  // existing documents generate an error.
  return keys.map(key => {
    return docsMap.get(key) || new Error(typeof error === 'function' ? error(key) : error);
  });
};

/*
function getNumberFilter(f: Find, name: string): string {
  let w = '';
  if (isDefined(f.lte)) w = `${name} <= ${f.lte}`;
  if (isDefined(f.eq)) w = `${name} = ${f.eq}`;
  if (isDefined(f.neq)) w = `${name} <> ${f.neq}`;
  if (isDefined(f.lt)) w = `${name} < ${f.lt}`;
  if (isDefined(f.gt)) w = `${name} > ${f.gt}`;
  if (isDefined(f.gte)) w = `${name} >= ${f.gte}`;
  if (isDefined(f.between)) w = `${name} BETWEEN ${f.between.lower} AND ${f.between.upper}`;
  return w;
}

function getBoolFilter(f: FilterFieldComparison<boolean>, name: string): string {
  let w = '';
  if (f.is !== undefined) w = `${name} IS ${f.is}`;
  if (f.isNot !== undefined) w = `${name} IS NOT ${f.isNot}`;
  return w;
}

function getStringFilter(f: FilterFieldComparison<string>, name: string): string {
  let w = '';
  const fname = name.split('.').length > 1 ? name : `"${name}"`;
  if (f.like) w = `${fname} LIKE '${f.like}'`;
  if (f.notLike) w = `${fname} NOT LIKE '${f.notLike}'`;
  if (f.iLike) w = `${fname} ILIKE '${f.iLike}'`;
  if (f.notILike) w = `${fname} NOT ILIKE '${f.notILike}'`;
  if (f.eq) w = `${fname} = '${f.eq}'`;
  if (f.neq) w = `${fname} <> '${f.neq}'`;
  if (f.in) w = `${fname} IN ('${f.in.join(`','`)}')`;
  return w;
}


 */
