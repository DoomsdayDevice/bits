import { memoize } from 'lodash';
import { ObjectType } from '@nestjs/graphql';

export const getOrCreateModelByName = memoize(name => {
  @ObjectType(name)
  class Model {}
  return Model;
});
