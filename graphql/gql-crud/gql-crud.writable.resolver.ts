import { Inject, Type } from '@nestjs/common';
import { Args, Mutation, Resolver } from '@nestjs/graphql';
import { IBaseServiceWrite, IUpdateOneInput } from '@bits/graphql/gql-crud/gql-crud.interface';
import {
  getDefaultCreateOneInput,
  getDefaultUpdateOneInput,
} from '@bits/graphql/gql-crud/gql-crud.dto';
import { GraphQLUUID } from 'graphql-scalars';
import { ICrudService } from '@bits/services/interface.service';
import { ObjectLiteral } from 'typeorm';
import { renameFunc } from '@bits/bits.utils';

export const WriteResolverMixin =
  <T extends ObjectLiteral, N extends string>(
    Model: Type<T>,
    Service: Type<ICrudService<T>>,
    modelName?: N,
    Create?: Type,
  ) =>
  <B extends Type>(Base: B): Type<IBaseServiceWrite<T, N> & InstanceType<B>> => {
    const name = modelName || Model.name;
    const UpdateOne = getDefaultUpdateOneInput(Model, name);
    const CreateOne = Create || getDefaultCreateOneInput(Model, name);

    @Resolver(() => Model)
    class GenericResolver extends Base {
      @Inject(Service) private svc!: ICrudService<T>;

      @Mutation(() => Boolean)
      async [`deleteOne${name}`](
        @Args('id', { type: () => GraphQLUUID }) id: string,
      ): Promise<boolean> {
        const res = await this.svc.deleteOne(id);
        return res;
      }

      @Mutation(() => Boolean)
      async [`updateOne${name}`](
        @Args('input', { type: () => UpdateOne }) input: IUpdateOneInput<T>,
      ): Promise<boolean> {
        const res = await this.svc.updateOne(input.id, input.update);
        return res;
      }

      @Mutation(() => Model)
      async [`createOne${name}`](@Args('input', { type: () => CreateOne }) input: T): Promise<T> {
        return this.svc.createOne(input);
      }
    }
    renameFunc(GenericResolver, `${modelName}Resolver`);

    return GenericResolver as any;
  };
