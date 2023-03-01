import { Type } from "@nestjs/common";
import {
  BeforeInsert,
  BeforeUpdate,
  Entity,
  PrimaryColumn,
  Unique,
} from "typeorm";
import { IsAlpha, validate } from "class-validator";
import { IEnumEntity } from "../types";

export function EnumEntity<Enum extends string>(
  EnumObj: Record<Enum, Enum>,
  enumName: string
): Type<IEnumEntity<Enum>> {
  @Unique(["name"])
  @Entity()
  class EnumEntityCls implements IEnumEntity<Enum> {
    @PrimaryColumn({ type: "varchar" })
    @IsAlpha()
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
