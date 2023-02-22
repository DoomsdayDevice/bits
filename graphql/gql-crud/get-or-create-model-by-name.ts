import { memoize } from 'lodash';
import { InputType, ObjectType } from '@nestjs/graphql';

/**
 *
 */
export const getOrCreateModelByName = memoize(<T extends string>(name: T) => {
  @ObjectType(name)
  class Model {}
  return Model;
});

export const getOrCreateInputByName = memoize(<T extends string>(name: T) => {
  @InputType(name)
  class Model {}
  return Model;
});
