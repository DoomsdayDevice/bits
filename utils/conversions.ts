import { FindManyOptions, FindOptionsWhere, ILike, In, Like } from 'typeorm';
import { IGrpcFindManyInput } from '@bits/grpc/grpc-crud/grpc-controller.interface';
import { FindOptionsOrder } from 'typeorm/find-options/FindOptionsOrder';
import { Sort } from '@bits/grpc/grpc.dto';
import { IFindManyServiceInput, IServiceWhere } from '@bits/services/interface.service';
import { isNil, isObject, toUpper } from 'lodash';

/** to typeorm/service layer filter */
export function convertGrpcFilterToService<T>(filter: any = {}): FindOptionsWhere<T> {
  const newFilter: any = {};
  for (const key of Object.keys(filter)) {
    const value = filter[key];
    if (key === '_or' || key === '_and') {
      newFilter[toUpper(key.slice(1))] = value.values.map((f: any) =>
        convertGraphqlFilterToService(f),
      );
    } else if (value.eq !== undefined) newFilter[key] = value.eq;
    else if (value.in) newFilter[key] = In(value.in.values);
    else if (value.like) newFilter[key] = Like(value.like);
    else if (value.iLike) newFilter[key] = ILike(value.iLike);
    else if (value.elemMatch) newFilter[key] = convertGrpcFilterToService(value.elemMatch);
    else {
      newFilter[key] = convertGrpcFilterToService(value);
    }
  }
  return newFilter;
}

export function convertGraphqlFilterToService<T>(filter: any): IServiceWhere<T> {
  const newFilter: any = {};
  for (const key of Object.keys(filter)) {
    const value = filter[key];
    if (key === 'OR' || key === 'AND') {
      newFilter[key] = value.map((f: any) => convertGrpcFilterToService(f));
    } else if (value.eq !== undefined) newFilter[key] = value.eq;
    else if (value.in) newFilter[key] = In(value.in.values);
    else if (value.like) newFilter[key] = Like(value.like);
    else if (value.iLike) newFilter[key] = ILike(value.iLike);
    else if (value.elemMatch) newFilter[key] = convertGraphqlFilterToService(value.elemMatch);
    else {
      newFilter[key] = convertGraphqlFilterToService(value);
    }
  }
  return newFilter;
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
  if (where.OR) {
    grpcFilter._or = { values: where.OR.map(f => convertServiceFilterToGrpc(f)) };
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

export function convertServiceFindManyInputToTypeorm<T>(
  input: IFindManyServiceInput<T>,
): FindManyOptions<T> {
  const result: FindManyOptions<T> = { ...input } as any;

  if (input.where?.OR) result.where = input.where.OR;
  return result;
}
