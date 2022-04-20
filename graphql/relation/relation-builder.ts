import { Inject, Type } from '@nestjs/common';
import { Parent, ResolveField } from '@nestjs/graphql';
import { getRelations } from './relation.decorator';
import { crudServiceReflector } from '../../services/crud.constants';

const toInject: { dto: any; resolver: any; svcName: string }[] = [];

/**
 * launched from main.ts after all classes and decorators load
 */
export function injectServices() {
  for (const { dto, resolver, svcName } of toInject) {
    const cls = crudServiceReflector.get(dto);
    Inject(cls)(resolver.prototype, svcName);
  }
}

function buildRel<T>(one: boolean, relName: string, Resolver: Type, relDTO: Type, svcName: string) {
  // send to inject service
  toInject.push({ dto: relDTO, resolver: Resolver, svcName });

  Parent()(Resolver.prototype, relName, 0);

  ResolveField(relName, () => (one ? relDTO : [relDTO]))(Resolver.prototype, relName, {
    value: Resolver.prototype[relName],
  });
}

export function buildRelations<T>(DTOCls: Type<T>, CrudResolver: Type) {
  const { one, many } = getRelations(DTOCls);

  const svcName = (r: string) => `${r}Service`;

  if (one)
    for (const relName of Object.keys(one)) {
      CrudResolver.prototype[relName] = async function findOne(par: any) {
        // get the corresponding service and run
        const svc = this[svcName(relName)];
        const id = par[`${relName}Id`];
        return svc.findOne({ id });
      };
      buildRel(true, relName, CrudResolver, one[relName].DTO, svcName(relName));
    }

  if (many)
    for (const relName of Object.keys(many)) {
      CrudResolver.prototype[relName] = async function findMany(par: any) {
        // get the corresponding service and run
        const svc = this[svcName(relName)];
        // IF simpleArray - join with the other table
        // ELSE only return the joinEntity
        const roles = await svc.findMany({});

        return roles.nodes;
      };
      buildRel<T>(false, relName, CrudResolver, many[relName].DTO, svcName(relName));
    }
}
