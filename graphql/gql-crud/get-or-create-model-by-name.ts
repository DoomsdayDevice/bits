import { memoize } from 'lodash';
import { ObjectType } from '@nestjs/graphql';

/**
 *
 */
export const getOrCreateModelByName = memoize(<T extends string>(name: T) => {
  @ObjectType(name)
  class Model {}
  return Model;
});
