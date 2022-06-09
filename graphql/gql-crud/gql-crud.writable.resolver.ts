import { Inject, Type } from '@nestjs/common';
import { Args, Mutation, Resolver } from '@nestjs/graphql';
import { IBaseServiceWrite } from '@api-types/types';
import { IUpdateOneInput } from '@bits/graphql/gql-crud/gql-crud.interface';
import {
  getDefaultCreateOneInput,
  getDefaultUpdateOneInput,
} from '@bits/graphql/gql-crud/gql-crud.dto';
import { IGrpcService } from '@bits/grpc/grpc.interface';
import { GraphQLUUID } from 'graphql-scalars';
import { generateFieldMask } from '@bits/grpc/field-mask.grpc.utils';

export const WriteResolverMixin =
  <T, N extends string>(Model: Type<T>, Service: Type, modelName?: N, Create?: Type) =>
  <B extends Type>(Base: B): Type<IBaseServiceWrite<T, N> & InstanceType<B>> => {
    const name = modelName || Model.name;
    const UpdateOne = getDefaultUpdateOneInput(Model, name);
    const CreateOne = Create || getDefaultCreateOneInput(Model, name);

    @Resolver(() => Model)
    class GenericResolver extends Base {
      @Inject(Service) private svc!: IGrpcService<T>;

      @Mutation(() => Boolean)
      async [`deleteOne${name}`](
        @Args('id', { type: () => GraphQLUUID }) id: string,
      ): Promise<boolean> {
        const res = await this.svc.deleteOne({ id });
        return res.success;
      }

      @Mutation(() => Boolean)
      async [`updateOne${name}`](
        @Args('input', { type: () => UpdateOne }) input: IUpdateOneInput<T>,
      ): Promise<boolean> {
        const update = { ...input.update, id: input.id };
        const updateMask = { paths: generateFieldMask(update) };
        const res = await this.svc.updateOne({
          update,
          updateMask,
        });
        return res.success;
      }

      @Mutation(() => Model)
      async [`createOne${name}`](@Args('input', { type: () => CreateOne }) input: T): Promise<T> {
        return this.svc.createOne(input);
      }
    }

    return GenericResolver as any;
  };
