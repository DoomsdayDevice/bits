/* eslint-disable */
// TODO сделать по красоте

import {
  SelectQueryBuilder,
  Brackets,
  // WhereExpression,
  FindOperator,
  Repository,
  FindOptionsRelationByString,
  ObjectLiteral,
} from 'typeorm';
import * as _ from 'lodash';
// import { Class } from '@nestjs-query/core';

import { FilterOperation } from '../../backend/src/services/find-operators';
import { NestedFindManyOpts } from '../../backend/src/repos/repo.interface';
import { union } from 'lodash';
import { Type } from '@nestjs/common';
import { getRelations } from '@bits/db/get-relations';
import { IConnection } from '@bits/bits.types';
// type CustomOperator<T> = FindOperator<T> | BossOperator;

export class NestedQuery<T extends ObjectLiteral> {
  currentNum = 0;

  query: SelectQueryBuilder<T>;

  constructor(private Entity: Type<T>, private baseAlias: string, repository: Repository<T>) {
    this.baseAlias = _.camelCase(baseAlias);
    this.query = repository.createQueryBuilder(this.baseAlias);
  }

  // NESTED FILTERING
  private getParentAlias(child: any, childIndex: any, relations: string[]) {
    const getLevel = (rel: string) => rel.split('.').length;

    const childLevel = getLevel(child);
    const parentCandidates = relations.filter(
      (r, index) => index < childIndex && getLevel(r) === childLevel - 1,
    );
    if (!parentCandidates.length) return this.baseAlias;
    const parent = parentCandidates[parentCandidates.length - 1];
    return _.camelCase(`${this.baseAlias} ${parent}`);
  }

  private static getChildAlias(parentAlias: string, childKey: string) {
    return parentAlias + childKey[0].toUpperCase() + childKey.slice(1);
  }

  private getMappedAlias(alias: string, aliasMap: Set<any>): string {
    if (alias === this.baseAlias) return this.baseAlias;
    for (const al of aliasMap) {
      if (al.name === alias) return al.hash;
    }
    throw new Error('alias mapping problem during query building');
  }

  private applyJoins(
    relations: string[],
    filterRels: string[],
    query: SelectQueryBuilder<T>,
    aliasMap: any,
  ) {
    const allRels = union(relations, filterRels);
    allRels.forEach((rel, index) => {
      const parentAlias = this.getParentAlias(rel, index, relations);

      const splitRel = rel.split('.');
      const childName = splitRel[splitRel.length - 1];
      const path = `${this.getMappedAlias(_.camelCase(parentAlias), aliasMap)}.${childName}`;
      const alias = NestedQuery.getChildAlias(parentAlias, childName);
      const aliasHash = String.fromCharCode(65 + aliasMap.size);
      aliasMap.add({ name: alias, hash: aliasHash });
      if (relations.includes(rel)) query.leftJoinAndSelect(path, aliasHash);
      else query.leftJoin(path, aliasHash);
    });
  }

  private parseFindOperator(
    operator: any,
    query: SelectQueryBuilder<T>,
    valueName: any,
    path: string,
  ) {
    const opType = operator._type;
    // if (opType === 'in' && operator.value.length) {
    if (opType === 'in') {
      if (!operator.value.length) query.andWhere('FALSE');
      else query.andWhere(`${path} IN (:...${valueName})`, { [valueName]: operator.value });
    } else if (opType === 'isNull') {
      query.andWhere(`${path} IS NULL`);
    } else if (opType === 'not') {
      const subOperator = operator._value;
      const subOpType = subOperator._type;

      if (subOpType && subOpType === 'isNull') {
        query.andWhere(`${path} IS NOT NULL`);
      } else if (subOpType && subOpType === 'in') {
        query.andWhere(`${path} NOT IN (:...${valueName})`, { [valueName]: subOperator.value });
      } else {
        query.andWhere(`${path} != :${valueName}`, { [valueName]: operator.value });
      }
    } else if (opType === 'regex') {
      query.andWhere(`${path} ~* :${valueName}`, { [valueName]: operator.value });
    } else if (opType === 'lessThan') {
      query.andWhere(`${path} < :${valueName}`, { [valueName]: operator.value });
    } else if (opType === 'lessThanOrEqual') {
      query.andWhere(`${path} <= :${valueName}`, { [valueName]: operator.value });
    } else if (opType === 'moreThan') {
      query.andWhere(`${path} > :${valueName}`, { [valueName]: operator.value });
    } else if (opType === 'moreThanOrEqual') {
      query.andWhere(`${path} >= :${valueName}`, { [valueName]: operator.value });
    } else if (opType === 'raw') {
      //
    } else if (opType === 'between') {
      //
    } else if (opType === 'like') {
      //
    } else if (opType === 'any') {
      //
    }
  }

  private parseFilterKey(
    key: any,
    alias: string,
    where: any,
    query: SelectQueryBuilder<T>,
    aliasMap: Set<any>,
  ) {
    const valueIsAPrimitive = where[key] || where[key] === false;
    const value: any = valueIsAPrimitive ? where[key] : where;

    const aliasHash = this.getMappedAlias(alias, aliasMap);
    const path = `${aliasHash}.${key}`;
    const valueName = _.camelCase(`${alias} ${key}${this.currentNum}`);
    if (typeof value !== 'object') {
      const variables: any = {};
      variables[valueName] = value;

      query.andWhere(`${path}=:${valueName}`, variables);
    } else if (value._type) {
      this.parseFindOperator(value, query, valueName, path);
    } else {
      const boss = where[key] instanceof FilterOperation;
      const childAlias = boss ? alias : NestedQuery.getChildAlias(alias, key);
      this.applyFilter(childAlias, where[key], query, aliasMap, boss ? key : null);
    }
  }

  private applyFilter(alias: string, where: any, query: any, aliasMap: Set<any>, fieldKey = null) {
    if (where instanceof FilterOperation) {
      for (const whereElem of where.value) {
        query[`${where.type}Where`](
          new Brackets(innerQuery => {
            this.applyFilter(alias, whereElem, innerQuery, aliasMap, fieldKey);
          }),
        );
        this.currentNum++;
      }
    } else if (where instanceof FindOperator) {
      // how to get own key here
      this.parseFilterKey(fieldKey, alias, where, query, aliasMap);
    } else {
      for (const key of Object.keys(where)) {
        this.parseFilterKey(key, alias, where, query, aliasMap);
      }
    }
  }

  private getOrderBy(fieldPath: string, aliasMap: Set<any>): string {
    const arr = fieldPath.split('.');
    arr.unshift(this.baseAlias);
    const lastElem = arr.pop();
    const finalAlias = _.camelCase(arr.join('.'));

    try {
      return `${this.getMappedAlias(finalAlias, aliasMap)}.${lastElem}`;
    } catch (e: any) {
      throw new Error(`orderBy error: ${e.message}`);
    }
  }

  private getRelsFromFilter(filter: any): string[] {
    const { oneToManyRelations, manyToOneRelations, manyToManyRelations } = getRelations(
      this.Entity,
    );
    const rels = [...oneToManyRelations, ...manyToOneRelations, ...manyToManyRelations];
    const relNames = rels.map(r => r.propertyName);
    const relsInFilter: string[] = [];
    for (const key of Object.keys(filter)) {
      const val = filter[key];
      // has fields that are themselves objects
      if (relNames.includes(key)) relsInFilter.push(key);
    }
    return relsInFilter;
  }

  public async execute({
    relations,
    where,
    take,
    skip,
    orderBy,
  }: NestedFindManyOpts<T>): Promise<IConnection<T>> {
    const aliasMap = new Set([]);

    // get relations from filter
    const filterRels = this.getRelsFromFilter(where);
    // const relUnion = union(, relations || []);
    this.applyJoins(
      (relations as FindOptionsRelationByString) || [],
      filterRels,
      this.query,
      aliasMap,
    );
    if (where) this.applyFilter(this.baseAlias, where, this.query, aliasMap);
    if (orderBy) {
      for (const o of Object.keys(orderBy)) {
        this.query.addOrderBy(this.getOrderBy(o, aliasMap), orderBy[o]);
      }
    }

    if (take) this.query.take(take);
    if (skip) this.query.skip(skip);

    const query = this.query.getQuery();
    const nodes = await this.query.getMany();

    const totalCount = await this.query.getCount();
    return { totalCount, nodes };
  }
}
