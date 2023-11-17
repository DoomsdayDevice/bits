import { DefaultNamingStrategy, Table, NamingStrategyInterface } from "typeorm";
import { RandomGenerator } from "typeorm/util/RandomGenerator";
import { snakeCase } from "lodash";

/**
 * https://github.com/typeorm/typeorm/blob/master/src/naming-strategy/DefaultNamingStrategy.ts
 */

export class CustomNamingStrategy
  extends DefaultNamingStrategy
  implements NamingStrategyInterface
{
  protected getTableName(tableOrName: Table | string): string {
    const name = (
      typeof tableOrName === "string" ? tableOrName : tableOrName.name
    )
      .split(".")
      .pop();

    if (!name) {
      throw new Error(`Table name <${name}> doesn't contain schema`);
    }

    return name;
  }

  checkConstraintName(
    tableOrName: Table | string,
    expression: string,
    isEnum?: boolean
  ): string {
    const tableName = this.getTableName(tableOrName).replace(".", "_");
    const key = `${tableName}_${expression}`;
    const name = `CHK_${tableName}_${RandomGenerator.sha1(key).substr(0, 26)}`;
    return isEnum ? `${name}_ENUM` : name;
  }

  uniqueConstraintName(
    tableOrName: Table | string,
    columnNames: string[]
  ): string {
    const tableName = this.getTableName(tableOrName).replace(".", "_");
    return `UQ_${tableName}_${columnNames.join("_")}`;
  }

  indexName(
    tableOrName: Table | string,
    columnNames: string[],
    where?: string
  ): string {
    const tableName = this.getTableName(tableOrName).replace(".", "_");
    let key = `${tableName}_${[...columnNames].sort().join("_")}`;
    // if (where) {
    //   key += `_${where}`;
    // }

    return `IDX_${key}_${RandomGenerator.sha1(key).substr(0, 4)}`;
  }

  primaryKeyName(tableOrName: Table | string, columnNames: string[]): string {
    const tableName = this.getTableName(tableOrName).replace(".", "_");
    return `PK_${tableName}_${[...columnNames].sort().join("_")}`;
  }

  relationConstraintName(
    tableOrName: Table | string,
    columnNames: string[],
    where?: string
  ): string {
    const tableName = this.getTableName(tableOrName).replace(".", "_");
    let key = `${tableName}_${[...columnNames].sort().join("_")}`;
    if (where) {
      key += `_${where}`;
    }

    return `REL_${key}`;
  }

  defaultConstraintName(
    tableOrName: Table | string,
    columnName: string
  ): string {
    const tableName = this.getTableName(tableOrName).replace(".", "_");
    return `DF_${tableName}_${columnName}`;
  }

  foreignKeyName(tableOrName: Table | string, columnNames: string[]): string {
    const tableName = this.getTableName(tableOrName).replace(".", "_");
    return `FK_${tableName}_${[...columnNames].sort().join("_")}`;
  }

  tableName(targetName: string, userSpecifiedName: string | undefined): string {
    return userSpecifiedName || snakeCase(targetName.replace("Entity", ""));
  }

  columnName(propertyName: string, customName: string | undefined): string {
    return snakeCase(customName || propertyName);
  }
}
