import { Type } from '@nestjs/common';
import { IEnumEntity } from '../../../src/core/db/db.interface';
import { BeforeInsert, BeforeUpdate, Entity, PrimaryColumn, Unique } from 'typeorm';
import { GrpcMessageDef } from '../../grpc/src/decorators/message.decorator';
import { IsAlpha, validate } from 'class-validator';
import { GrpcFieldDef } from '../../grpc/src/decorators/field.decorator';

export function EnumEntity<Enum extends string>(
  EnumObj: Record<Enum, Enum>,
  enumName: string,
): Type<IEnumEntity<Enum>> {
  @Unique(['name'])
  @Entity()
  @GrpcMessageDef({ isAbstract: true })
  class EnumEntityCls implements IEnumEntity<Enum> {
    @PrimaryColumn({ type: 'varchar' })
    @IsAlpha()
    @GrpcFieldDef(() => enumName, { filterable: true })
    name!: Enum;

    @BeforeInsert()
    @BeforeUpdate()
    async validate(): Promise<void> {
      const errors = await validate(this);
      if (errors.length) throw new Error(JSON.stringify(errors));
    }
  }
  return EnumEntityCls;
}
