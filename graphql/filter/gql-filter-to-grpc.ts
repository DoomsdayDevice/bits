import { IGqlFilter } from './filter.interface';
import { IGrpcFilter } from '../../grpc/grpc-filter.interface';

// TODO do for nested and other operators
export function gqlFilterToGrpc<T, Enums, F extends IGqlFilter<T>>(
  filter?: F,
): IGrpcFilter<T, Enums> | undefined {
  if (!filter) return undefined;
  const compFieldNames = ['in', 'eq', 'lt', 'lte'];
  const keys = Object.keys(filter) as unknown as (keyof F)[];
  for (const key of keys) {
    const keyObj = filter[key] as any;
    const isComparison = keys.some(k => compFieldNames.includes(k as any));
    if (isComparison) {
      if (keyObj.in) {
        keyObj.in.values = keyObj.in;
      }
    } else {
      //
    }
  }

  return filter as any;
}
