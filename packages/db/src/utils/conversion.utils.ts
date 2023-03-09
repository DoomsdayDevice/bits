import {
  FindOperator,
  FindOptionsWhere,
  ILike,
  In,
  Like,
  Not,
  ObjectLiteral,
  SelectQueryBuilder,
} from "typeorm";
import { isObject } from "lodash";
import {
  IFindManyOptions,
  IFindManyServiceInput,
  IFindOptionsOrder,
} from "@bits/backend";
import { getKeys, IListValue, Sort } from "@bits/core";

export function isFindOperator<T>(obj: any): obj is FindOperator<T> {
  return obj._type;
}

export function applyFilterToQueryBuilder<T extends ObjectLiteral>(
  where: FindOptionsWhere<T>,
  qb: SelectQueryBuilder<T>
) {
  for (const key of Object.keys(where) as (keyof T)[]) {
    if (isObject(key)) applyFilterToQueryBuilder(where[key]!, qb);
    else {
      if (isFindOperator(where[key])) {
        if (where[key]._type === "in") {
          if (key === "ids") qb.whereInIds(where[key]);
          else qb.andWhere({ [key]: where[key] });
        }
      } else qb.andWhere({ [key]: where[key] });
    }
  }

  return qb;
}

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

export function convertServiceFindManyInputToTypeorm<T>(
  input: IFindManyServiceInput<T>
): IFindManyOptions<T> {
  const result: IFindManyOptions<T> = { ...input } as any;

  // TODO
  // and
  if (input.where?.OR)
    result.where = input.where.OR.map((w) => convertServiceFilterToTypeorm(w));
  else if (input.where)
    result.where = convertServiceFilterToTypeorm(input.where);
  return result;
}

function convertVal(val: any) {
  if (val._type == "in") return In(val.value);
  if (val._type == "like") return Like(val.value);
  if (val._type == "iLike") return ILike(val.value);
  if (val._type == "not") return Not(convertVal(val.value));
  return val;
}

function convertServiceFilterToTypeorm(filter: ObjectLiteral) {
  const newFilter = {};
  for (const key of getKeys(filter)) {
    newFilter[key] = convertVal(filter[key]);
  }
  return newFilter;
}

export function convertGrpcOrderByToTypeorm<T = any>(
  sorting: IListValue<Sort>
): IFindOptionsOrder<T> {
  const obj: IFindOptionsOrder<T> = {};
  for (const o of sorting.values) {
    obj[o.field as keyof IFindOptionsOrder<T>] = o.direction as any;
  }
  return obj;
}
