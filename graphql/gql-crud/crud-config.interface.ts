import { CustomDecorator, Type } from '@nestjs/common';
import { ICrudService } from '../../services/interface.service';
import { PagingStrategy } from '../../common/paging-strategy.enum';
import { ModuleImportElem } from '../../bits.types';
import { AnyAbility } from '@casl/ability';
import { Privilege } from '@bits/auth/privilege.type';
import { ObjectLiteral } from 'typeorm';

export interface ICaslAbilityFactory<IUser> {
  createForUser(u: IUser): AnyAbility;
}

export interface IWriteResolverConfig<T extends ObjectLiteral, N extends string>
  extends Omit<IReadResolverConfig<T, N>, 'pagination'> {
  Create?: Type;
}

export interface IReadResolverConfig<T extends ObjectLiteral, N extends string> {
  Model: Type<T>;
  Service: Type<ICrudService<T>>;
  pagination: PagingStrategy;
  // CurrentUser: () => ParameterDecorator,
  modelIsInResources: (Model: Type) => boolean;
  getResourceNameFromModel: (Model: Type) => string;
  modelName?: N;
  AbilityFactory?: Type<ICaslAbilityFactory<unknown>>;
  RequirePrivileges?: (...p: Privilege[]) => CustomDecorator<string>;
}

export interface GqlWritableCrudConfig<T extends ModelResource, N extends string>
  extends Omit<IReadResolverConfig<T, N>, 'Service' | 'pagination' | 'Model'> {
  Model?: Type<T>;
  Service?: Type<ICrudService<T>>;
  imports?: ModuleImportElem[];
  grpcServiceName?: string;
  pagination?: PagingStrategy;
  ModelResolver?: any;
  /** using grpc or simply typeorm */
  type: 'grpc' | 'typeorm';
  readOnly?: boolean;
}
