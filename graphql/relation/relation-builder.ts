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

export function buildRelations<T>(DTOCls: Type<T>, CrudResolver: Type) {
  const { one, many } = getRelations(DTOCls);
  if (one)
    for (const r of Object.keys(one)) {
      const svcName = `${r}Service`;
      const relDTO = one[r].DTO;
      CrudResolver.prototype[r] = async function (par: any) {
        // get the corresponding service and run
        const svc = this[svcName];
        const id = par[`${r}Id`];
        return svc.findOne(id);
      };
      // send to inject service
      toInject.push({ dto: relDTO, resolver: CrudResolver, svcName });

      Parent()(CrudResolver.prototype, r, 0);

      ResolveField(r, () => one[r].DTO)(CrudResolver.prototype, r, {
        value: CrudResolver.prototype[r],
      });
    }

  if (many)
    for (const r of Object.keys(many)) {
      const svcName = `${r}Service`;
      CrudResolver.prototype[r] = async function (par: any) {
        // get the corresponding service and run
        const svc = this[svcName];
        // IF simpleArray - join with the other table
        // ELSE only return the joinEntity
        const roles = await svc.findMany({});

        return roles.nodes;
      };

      const relDTO = many[r].DTO;

      // send to inject service
      toInject.push({ dto: relDTO, resolver: CrudResolver, svcName });

      Parent()(CrudResolver.prototype, r, 0);

      ResolveField(r, () => [many[r].DTO])(CrudResolver.prototype, r, {
        value: CrudResolver.prototype[r],
      });
    }
}
