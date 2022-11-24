import { DefaultNamingStrategy, Table, NamingStrategyInterface } from 'typeorm';
import { RandomGenerator } from 'typeorm/util/RandomGenerator';

/**
 * https://github.com/typeorm/typeorm/blob/master/src/naming-strategy/DefaultNamingStrategy.ts
 */
export class CustomNamingStrategy extends DefaultNamingStrategy implements NamingStrategyInterface {
  protected getMyTableName(tableOrName: Table | string): string {
    if (typeof tableOrName !== 'string') {
      tableOrName = tableOrName.name;
    }

    return tableOrName.split('.').pop()!;
  }

  checkConstraintName(tableOrName: Table | string, expression: string, isEnum?: boolean): string {
    const tableName = this.getMyTableName(tableOrName);
    const replacedTableName = tableName.replace('.', '_');
    const key = `${replacedTableName}_${expression}`;
    const name = `CHK_${replacedTableName}_${RandomGenerator.sha1(key).substr(0, 26)}`;
    return isEnum ? `${name}_ENUM` : name;
  }

  uniqueConstraintName(tableOrName: Table | string, columnNames: string[]): string {
    const tableName = this.getMyTableName(tableOrName);
    const replacedTableName = tableName.replace('.', '_');
    return `UQ_${replacedTableName}_${columnNames.join('_')}`;
  }

  indexName(tableOrName: Table | string, columnNames: string[], where?: string): string {
    // sort incoming column names to avoid issue when ["id", "name"] and ["name", "id"] arrays
    const clonedColumnNames = [...columnNames];
    clonedColumnNames.sort();
    const tableName = this.getMyTableName(tableOrName);
    const replacedTableName = tableName.replace('.', '_');
    let key = `${replacedTableName}_${clonedColumnNames.join('_')}`;
    if (where) key += `_${where}`;

    return `IDX_${replacedTableName}_${RandomGenerator.sha1(key).substr(0, 26)}`;
  }

  primaryKeyName(tableOrName: Table | string, columnNames: string[]): string {
    // sort incoming column names to avoid issue when ["id", "name"] and ["name", "id"] arrays
    const clonedColumnNames = [...columnNames];
    clonedColumnNames.sort();
    const tableName = this.getMyTableName(tableOrName);
    const replacedTableName = tableName.replace('.', '_');
    const key = `${replacedTableName}_${clonedColumnNames.join('_')}`;
    return `PK_${key}`;
  }

  relationConstraintName(
    tableOrName: Table | string,
    columnNames: string[],
    where?: string,
  ): string {
    // sort incoming column names to avoid issue when ["id", "name"] and ["name", "id"] arrays
    const clonedColumnNames = [...columnNames];
    clonedColumnNames.sort();
    const tableName = this.getMyTableName(tableOrName);
    const replacedTableName = tableName.replace('.', '_');
    let key = `${replacedTableName}_${clonedColumnNames.join('_')}`;
    if (where) key += `_${where}`;

    return `REL_${key}`;
  }

  defaultConstraintName(tableOrName: Table | string, columnName: string): string {
    const tableName = this.getMyTableName(tableOrName);
    const replacedTableName = tableName.replace('.', '_');
    const key = `${replacedTableName}_${columnName}`;
    return `DF_${key}`;
  }

  foreignKeyName(
    tableOrName: Table | string,
    columnNames: string[],
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _referencedTablePath?: string,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _referencedColumnNames?: string[],
  ): string {
    // sort incoming column names to avoid issue when ["id", "name"] and ["name", "id"] arrays
    const clonedColumnNames = [...columnNames];
    clonedColumnNames.sort();
    const tableName = this.getMyTableName(tableOrName);
    const replacedTableName = tableName.replace('.', '_');
    const key = `${replacedTableName}_${clonedColumnNames.join('_')}`;
    return `FK_${key}`;
  }

  // exclusionConstraintName(
  //     tableOrName: Table | string,
  //     expression: string,
  // ): string {
  //     const tableName = this.getTableName(tableOrName)
  //     const replacedTableName = tableName.replace(".", "_")
  //     const key = `${replacedTableName}_${expression}`
  //     return "XCL_" + RandomGenerator.sha1(key).substr(0, 26)
  // }
}
