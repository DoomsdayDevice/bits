import { Type } from '@nestjs/common';
import { getConnection } from 'typeorm';

// TODO FINISH GRPC RELS
export function getRelations<DTO>(Entity: Type<DTO>, opts?: any) {
  const ans = getConnection().getMetadata(Entity);
  return ans;
}
