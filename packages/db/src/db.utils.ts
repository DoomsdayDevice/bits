// import { allParsingInstructions, MongoQueryParser } from '@ucast/mongo';
// import { allInterpreters, createSqlInterpreter } from '@ucast/sql';

// export function convertGrpcFilterToUcast(filter: any) {
//   const con = renameKeyNames(filter, { elemMatch: '$elemMatch', eq: '$eq' });
//   const parser = new MongoQueryParser(allParsingInstructions);
//   const parsedCon = parser.parse(con);
//
//   const myInterpret = createSqlInterpreter(allInterpreters);
//
//   // const qb = interpret(parsedCon, getConnection().createQueryBuilder(Activity, 'a'));
//   // const q = qb.getQueryAndParameters();
//   // return qb;
// }
