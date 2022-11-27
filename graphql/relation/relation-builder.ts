import { Inject, Type } from '@nestjs/common';
import { Info, Parent, ResolveField } from '@nestjs/graphql';
import { ICrudService } from '@bits/services/interface.service';
import { GraphQLResolveInfo } from 'graphql/type';
import { getRelations } from './relation.decorator';
import { crudServiceReflector } from '../../services/crud.constants';
import { lowercaseFirstLetter } from '@core/utils';
import { In } from 'typeorm';

const servicesToInjectIntoResolvers: { dto: any; resolver: any; svcName: string }[] = [];

/**
 * launched from main.ts after all classes and decorators load
 * TODO use ModuleRef instead of injecting all these services, also remove @Global from generic modules
 */
export function injectServices() {
  for (const { dto, resolver, svcName } of servicesToInjectIntoResolvers) {
    const cls = crudServiceReflector.get(dto);
    Inject(cls)(resolver.prototype, svcName);
  }
}

function buildRel<T>(one: boolean, relName: string, Resolver: Type, relDTO: Type, svcName: string) {
  // send to inject service
  servicesToInjectIntoResolvers.push({ dto: relDTO, resolver: Resolver, svcName });

  Parent()(Resolver.prototype, relName, 0);
  Info()(Resolver.prototype, relName, 1);

  ResolveField(relName, () => (one ? relDTO : [relDTO]))(Resolver.prototype, relName, {
    value: Resolver.prototype[relName],
  });
}

/** injects services for relations to join */
export function buildRelationsForModelResolver<T>(DTOCls: Type<T>, CrudResolver: Type) {
  const { one, many } = getRelations(DTOCls);

  const svcName = (r: string) => `${r}Service`;

  if (one)
    // TODO apply filters like getFilterForResource
    for (const relName of Object.keys(one)) {
      CrudResolver.prototype[relName] = async function resolveOne(
        parent: T,
        info: GraphQLResolveInfo,
      ) {
        // get the corresponding service and run
        const svc = this[svcName(relName)];
        const opts = one[relName];

        const ownForeignKey = opts.customForeignKey?.ownForeignKey || `${relName}Id`;
        const value = parent[ownForeignKey];
        return svc.findOne({ [opts.customForeignKey?.referencedKey || 'id']: value });
      };
      buildRel(true, relName, CrudResolver, one[relName].DTO, svcName(relName));
    }

  if (many)
    for (const relName of Object.keys(many)) {
      CrudResolver.prototype[relName] = async function resolveMany(parent: T) {
        // get the corresponding service and run
        const svc: ICrudService<any> = this[svcName(relName)];
        const opts = many[relName];
        // IF simpleArray - join with the other table

        let nodes;

        if (opts.manyToManyByArr) {
          const refArray = parent[opts.manyToManyByArr.arrayName!];
          const refField = opts.manyToManyByArr.referencedFieldName!;
          nodes = await svc.findMany({
            where: { [refField]: In(refArray) },
          });
        } else if (opts.manyToManyByRefs) {
          const refField = opts.manyToManyByRefs.ownFieldThatIsReferenced!;
          const ownIdField = opts.manyToManyByRefs.ownIdField || 'id';
          nodes = await svc.findMany({
            where: { [refField]: parent[ownIdField] },
          });
        } else {
          // simple one to many
          // TODO
          const defaultIdField = `${lowercaseFirstLetter(DTOCls.name)}Id`;
          nodes = await svc.findMany({
            where: {
              [opts.oneToMany?.referencedFieldName || defaultIdField]:
                parent[opts.oneToMany?.ownIdField || 'id'],
            },
          });
        }
        // ELSE only return the joinEntity

        return nodes;
      };
      buildRel<T>(false, relName, CrudResolver, many[relName].DTO, svcName(relName));
    }
}
