import { CustomDecorator, Type } from '@nestjs/common';
import { ICrudService } from '../../services/interface.service';
import { PagingStrategy } from '../../common/paging-strategy.enum';
import { ModuleImportElem } from '../../bits.types';
import { AnyAbility } from '@casl/ability';
import { Privilege } from '@bits/auth/privilege.type';

export interface ICaslAbilityFactory<IUser> {
  createForUser(u: IUser): AnyAbility;
}

export interface IReadResolverConfig<T extends ModelResource, Resources, N extends string> {
  Model: Type<T>;
  Service: Type<ICrudService<T>>;
  pagination: PagingStrategy;
  // CurrentUser: () => ParameterDecorator,
  resources: Resources;
  modelName?: N;
  AbilityFactory?: Type<ICaslAbilityFactory<unknown>>;
  RequirePrivileges?: (...p: Privilege[]) => CustomDecorator<string>;
}

export interface GqlWritableCrudConfig<T extends ModelResource, Resources, N extends string>
  extends Omit<IReadResolverConfig<T, Resources, N>, 'Service' | 'pagination' | 'Model'> {
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
