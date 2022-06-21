import { EntityFieldsNames } from 'typeorm/common/EntityFieldsNames';
import { Sort } from '../grpc/grpc.dto';
import { renameKeyNames } from '../bits.utils';
import { allParsingInstructions, MongoQueryParser } from '@ucast/mongo';
import { allInterpreters, createSqlInterpreter } from '@ucast/sql';

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

export function convertGrpcFilterToUcast(filter: any) {
  const con = renameKeyNames(filter, { elemMatch: '$elemMatch', eq: '$eq' });
  const parser = new MongoQueryParser(allParsingInstructions);
  const parsedCon = parser.parse(con);

  const myInterpret = createSqlInterpreter(allInterpreters);

  // const qb = interpret(parsedCon, getConnection().createQueryBuilder(Activity, 'a'));
  // const q = qb.getQueryAndParameters();
  // return qb;
}
