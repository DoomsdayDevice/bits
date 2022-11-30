import { Inject, Type } from '@nestjs/common';
import { Info, Parent, ResolveField } from '@nestjs/graphql';
import { ICrudService } from '@bits/services/interface.service';
import { GraphQLResolveInfo } from 'graphql/type';
import { lowercaseFirstLetter } from '@core/utils';
import { getRepository, In, ObjectLiteral } from 'typeorm';
import DataLoader from 'dataloader';
import { lowerFirst } from 'lodash';
import { ensureOrder } from '@bits/db/conversion.utils';
import { ResolverRelation } from '@bits/graphql/relation/relation.interface';
import { getRelations } from './relation.decorator';
import { crudServiceReflector } from '../../services/crud.constants';
import { IBaseResolver, IBaseServiceRead } from '@bits/graphql/gql-crud/gql-crud.interface';

const servicesToInjectIntoResolvers: { dto: any; resolver: any; svcName: string }[] = [];

export const dataloaders: {
  loader: DataLoader<any, any>;
  svc: ICrudService<any>;
  name: string;
  RelDTO: any;
}[] = [];

export const populateLoaders = (app: any) => {
  for (const dl of dataloaders) {
    const cls = crudServiceReflector.get(dl.RelDTO);
    dl.svc = app.get(cls);
  }
};

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

function buildRel<T>(
  one: boolean,
  relName: string,
  Resolver: Type,
  relDTO: Type,
  svcName: string,
  opts: ResolverRelation<T, unknown>,
) {
  // send to inject service
  servicesToInjectIntoResolvers.push({ dto: relDTO, resolver: Resolver, svcName });

  Parent()(Resolver.prototype, relName, 0);
  Info()(Resolver.prototype, relName, 1);

  // inject dataloaders
  // const loaderName = `${lowerFirst(DTOCls.name)}${upperFirst(relName)}Loader`;
  // Context(loaderName)(Resolver.prototype, relName, 2);
  // dataloaders[loaderName] = createLoader()

  ResolveField(relName, () => (one ? relDTO : [relDTO]), { nullable: opts.nullable })(
    Resolver.prototype,
    relName,
    {
      value: Resolver.prototype[relName],
    },
  );
}

export const createLoader = (
  Resolver: any,
  loaderName: string,
): DataLoader<string, string | null> => {
  return new DataLoader(async (ids: readonly string[]) => {
    const { svc } = dataloaders.find(l => loaderName === l.name)!;
    const prop = svc.getPrimaryColumnName() as any;
    const many = await svc.findMany({ where: { [prop]: In(ids as any) } });
    return ensureOrder({ docs: many, keys: ids, prop });
  });
};

/** injects services for relations to join */
export function buildRelationsForModelResolver<T extends ObjectLiteral, N extends string>(
  DTOCls: Type<T>,
  CrudResolver: Type<IBaseResolver<T, N>>,
) {
  const { one, many } = getRelations(DTOCls);

  const svcName = (r: string) => `${r}Service`;

  if (one)
    // TODO apply filters like getFilterForResource
    for (const relName of Object.keys(one)) {
      const opts = one[relName];
      const loaderName = `${lowerFirst(opts.DTO.name)}Loader`;
      CrudResolver.prototype[relName] = async function resolveOne(
        parent: T,
        info: GraphQLResolveInfo,
      ) {
        // get the corresponding service and run
        const relSvc = this[svcName(relName)];

        const ownForeignKey = opts.customForeignKey?.ownForeignKey || (`${relName}Id` as keyof T);
        const value = parent[ownForeignKey];
        if (!value) return null;
        return dataloaders.find(l => loaderName === l.name)!.loader.load(value);
        // TODO referencedKey in dataloaders
        // return svc.findOne({ [opts.customForeignKey?.referencedKey || 'id']: value });
      };

      const exists = dataloaders.find(dl => dl.name === loaderName);
      const relationIdField = 'id';
      if (!exists)
        dataloaders.push({
          name: loaderName,
          loader: createLoader(CrudResolver, loaderName),
          RelDTO: one[relName].DTO,
        } as any);
      buildRel(true, relName, CrudResolver, one[relName].DTO, svcName(relName), opts);
    }

  if (many)
    for (const relName of Object.keys(many)) {
      const opts = many[relName];
      const loaderName = `${lowerFirst(opts.DTO.name)}Loader`;

      CrudResolver.prototype[relName] = async function resolveMany(parent: T) {
        // get the corresponding service and run
        const relSvc: ICrudService<any> = this[svcName(relName)];
        const parentSvc = this.svc as ICrudService<T>;
        const parentPrimaryColName = parentSvc.getPrimaryColumnName();
        // IF simpleArray - join with the other table

        let nodes;

        if (opts.manyToManyByArr) {
          const refArray = parent[opts.manyToManyByArr.arrayName];
          if (!Array.isArray(refArray))
            throw new Error(`${String(opts.manyToManyByArr.arrayName)} not an array!`);
          const refField = opts.manyToManyByArr.referencedFieldName!;

          // return dataloaders.find(l => loaderName === l.name)!.loader.loadMany(refArray);

          nodes = await relSvc.findMany({
            where: { [refField]: In(refArray) },
          });
          return nodes;
        } else if (opts.manyToManyByRefs) {
          const refField = opts.manyToManyByRefs.ownFieldThatIsReferenced;
          const ownIdField = opts.manyToManyByRefs.ownIdField || ('id' as keyof T);
          nodes = await relSvc.findMany({
            where: { [refField]: parent[ownIdField] },
          });
          return nodes;
        } else {
          // simple one to many
          // TODO
          const defaultIdField = `${lowercaseFirstLetter(DTOCls.name)}Id`;
          nodes = await relSvc.findMany({
            where: {
              [opts.oneToMany?.referencedFieldName || defaultIdField]:
                parent[opts.oneToMany?.ownPrimaryColName || parentPrimaryColName],
            },
          });
          return nodes;
        }
      };
      buildRel<T>(false, relName, CrudResolver, many[relName].DTO, svcName(relName), opts);
    }
}
