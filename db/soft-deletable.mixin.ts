import { Type } from '@nestjs/common';
import { DeleteDateColumn } from 'typeorm';

export interface ISoftDeletable {
  deletedAt: Date;
}

export function SoftDeletable<TBase extends Type>(
  Base: TBase,
): Type<ISoftDeletable & InstanceType<TBase>> {
  class SoftDeletable extends Base implements ISoftDeletable {
    @DeleteDateColumn({ type: 'timestamptz' })
    // @Expose()
    deletedAt!: Date;
  }

  return SoftDeletable;
}
