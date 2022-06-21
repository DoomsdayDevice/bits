import { getConnection, ILike, In, Like } from 'typeorm';
import { EntityFieldsNames } from 'typeorm/common/EntityFieldsNames';
import { Sort } from '@bits/grpc/grpc.dto';
import { Activity } from '@domain/activity/activity.entity';
import { renameKeyNames } from '@bits/bits.utils';
import { allInterpreters, createSqlInterpreter } from '@ucast/sql';
import { interpret } from '@ucast/sql/typeorm';

/**
 * promisify all methods on service except specified
 * for example for streaming
 */
export const promisify = <T extends object>(service: T, except: string[] = []) =>
  new Proxy(service, {
    get:
      (svc: any, methodName: string) =>
      (...params: any[]) => {
        if (except.includes(methodName)) return svc[methodName](...params);

        return svc[methodName](...params).toPromise();
      },
  });

export function convertGrpcFilterToTypeorm(filter: any = {}): any {
  const newFilter: any = {};
  for (const key of Object.keys(filter)) {
    const comparisonField = filter[key];
    if (comparisonField.eq !== undefined) newFilter[key] = comparisonField.eq;
    else if (comparisonField.in) newFilter[key] = In(comparisonField.in.values);
    else if (comparisonField.like) newFilter[key] = Like(comparisonField.like);
    else if (comparisonField.iLike) newFilter[key] = ILike(comparisonField.iLike);
    else {
      newFilter[key] = convertGrpcFilterToTypeorm(comparisonField);
    }
  }
  return newFilter;
}

type TypeORMOrderBy<Entity> = {
  [P in EntityFieldsNames<Entity>]?: 'ASC' | 'DESC' | 1 | -1;
};

export function convertGrpcOrderByToTypeorm<T = any>(orderBy: Sort[]): TypeORMOrderBy<T> {
  const obj: TypeORMOrderBy<T> = {};
  for (const o of orderBy) {
    obj[o.field as keyof TypeORMOrderBy<T>] = o.direction;
  }
  return obj;
}

export function convertGrpcFilterToUcast(filter: any): string {
  const con = renameKeyNames(filter, { elemMatch: '$elemMatch', eq: '$eq' });
  const myInterpret = createSqlInterpreter(allInterpreters);

  const qb = interpret(con, getConnection().createQueryBuilder(Activity, 'a'));
  return '';
}
