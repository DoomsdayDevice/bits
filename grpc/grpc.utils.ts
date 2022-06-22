import { ILike, In, Like } from 'typeorm';

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
    else if (comparisonField.elemMatch)
      newFilter[key] = convertGrpcFilterToTypeorm(comparisonField.elemMatch);
    else {
      newFilter[key] = convertGrpcFilterToTypeorm(comparisonField);
    }
  }
  return newFilter;
}
