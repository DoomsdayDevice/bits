// eslint-disable-next-line
import * as _ from 'lodash';
import { Transform, TransformFnParams } from 'class-transformer';
import { Defined } from '@bits/bits.types';
import { clone, isNil, isObject } from 'lodash';
import { Inject } from '@nestjs/common';
import { FindManyOptions, FindOptionsWhere, ILike, In, Like } from 'typeorm';
import { IGrpcFindManyInput } from '@bits/grpc/grpc-crud/grpc-controller.interface';
import { FindOptionsOrder } from 'typeorm/find-options/FindOptionsOrder';
import { Sort } from '@bits/grpc/grpc.dto';
import { IFindManyServiceInput, IServiceWhere } from '@bits/services/interface.service';

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

function isDefined<T extends any>(value: T): value is Defined<T> {
  return (value !== null && value !== undefined) as any;
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

export const OptionalInject = (token: any) => {
  if (token) return Inject(token);
  return () => {};
};

/** to typeorm/service layer filter */
export function convertGrpcFilterToService<T>(filter: any = {}): FindOptionsWhere<T> {
  const newFilter: any = {};
  for (const key of Object.keys(filter)) {
    const comparisonField = filter[key];
    if (comparisonField.eq !== undefined) newFilter[key] = comparisonField.eq;
    else if (comparisonField.in) newFilter[key] = In(comparisonField.in.values);
    else if (comparisonField.like) newFilter[key] = Like(comparisonField.like);
    else if (comparisonField.iLike) newFilter[key] = ILike(comparisonField.iLike);
    else if (comparisonField.elemMatch)
      newFilter[key] = convertGrpcFilterToService(comparisonField.elemMatch);
    else {
      newFilter[key] = convertGrpcFilterToService(comparisonField);
    }
  }
  return newFilter;
}

export function convertGraphqlFilterToService<T>(filter: any) {
  return convertGrpcFilterToService<T>(filter);
}

export function applyCursorPagingToInput(input: any): { where: any; take: any; order: any } {
  // add id > after
  // how to add AND condition for the same field
  input.order = { id: 'DESC' };
  input.where.id = input.where.id || {};
  // input.where.id;
  return input;
}

export function convertServiceInputToGrpc<T>(
  input: IFindManyServiceInput<T>,
): IGrpcFindManyInput<T> {
  const grpcInput: IGrpcFindManyInput<T> = {};

  if (input.where) grpcInput.filter = convertServiceFilterToGrpc(input.where);
  if (input.order) grpcInput.sorting = convertServiceOrderByToGrpc(input.order);
  if (!isNil(input.skip) || !isNil(input.take))
    grpcInput.paging = { offset: input.skip || 0, limit: input.take || 0 };

  return grpcInput;
}

export function convertServiceFilterToGrpc<T>(where: IServiceWhere<T>) {
  const grpcFilter: any = {};
  if (Array.isArray(where)) {
  } else {
    for (const key of Object.keys(where) as any[]) {
      const comparisonField = where[key as keyof FindOptionsWhere<T>] as any;
      if (comparisonField._type) {
        if (comparisonField._type === 'in')
          grpcFilter[key] = { in: { values: comparisonField._value } };
        else if (comparisonField._type === 'like')
          grpcFilter[key] = { like: comparisonField._value };
        else if (comparisonField._type === 'ilike')
          grpcFilter[key] = { iLike: comparisonField._value };
      } else if (isObject(comparisonField)) {
        // TODO
        grpcFilter[key] = convertServiceFilterToGrpc(comparisonField as any);
      } else {
        // if it's a simple field like a string
        grpcFilter[key] = { eq: comparisonField };
      }
    }
  }

  return grpcFilter;
}

export function convertServiceOrderByToGrpc<T>(order: FindOptionsOrder<T>) {
  return {
    values: (Object.keys(order) as (keyof FindOptionsOrder<T>)[]).map(k => ({
      field: k as string,
      direction: (order[k] as any).direction,
    })),
  };
}

export function convertGqlOrderByToTypeorm<T = any>(orderBy: Sort[]): FindOptionsOrder<T> {
  const obj: FindOptionsOrder<T> = {};
  for (const o of orderBy) {
    obj[o.field as keyof FindOptionsOrder<T>] = o.direction as any;
  }
  return obj;
}

export function convertGrpcOrderByToTypeorm<T = any>(orderBy: Sort[]): FindOptionsOrder<T> {
  const obj: FindOptionsOrder<T> = {};
  for (const o of orderBy) {
    obj[o.field as keyof FindOptionsOrder<T>] = o.direction as any;
  }
  return obj;
}
