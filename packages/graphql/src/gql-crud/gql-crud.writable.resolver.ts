import { Inject, Type } from "@nestjs/common";
import { Args, Mutation, Resolver } from "@nestjs/graphql";
import { GraphQLUUID } from "graphql-scalars";
import { IWriteResolverConfig } from "../types";
import { DeepPartial, ObjectLiteral, renameFunc } from "@bits/core";
import { Action, ICrudService } from "@bits/backend";
import { IBaseServiceWrite, IUpdateOneInput } from "../types";
import {
  getDefaultCreateOneInput,
  getDefaultUpdateOneInput,
  getUpdateOneInputInputMain,
} from "../inputs";

export const WriteResolverMixin =
  <T extends ObjectLiteral, N extends string, ResourceName extends string>({
    Model,
    Service,
    modelName,
    Create,
    Update,
    RequirePrivileges,
    AbilityFactory,
    getResourceNameFromModel,
  }: IWriteResolverConfig<T, N, ResourceName>) =>
  <B extends Type>(
    Base: B
  ): Type<IBaseServiceWrite<T, N> & InstanceType<B>> => {
    const name = modelName || Model.name;
    const UpdateOne = Update
      ? getUpdateOneInputInputMain(Update, name)
      : getDefaultUpdateOneInput(Model, name);
    const CreateOne = Create || getDefaultCreateOneInput(Model, name);

    @Resolver(() => Model)
    class GenericResolver extends Base {
      @Inject(Service) private svc!: ICrudService<T>;

      @Mutation(() => Boolean)
      async [`deleteOne${name}`](
        @Args("id", { type: () => GraphQLUUID }) id: string
      ): Promise<boolean> {
        const res = await this.svc.deleteOne({ id } as any);
        return res;
      }

      @Mutation(() => Model)
      async [`updateOne${name}`](
        @Args("input", { type: () => UpdateOne }) input: IUpdateOneInput<T>
      ): Promise<T> {
        return this.svc.updateOne(input.id, input.update);
      }

      @Mutation(() => Model)
      async [`createOne${name}`](
        @Args("input", { type: () => CreateOne }) input: DeepPartial<T>
      ): Promise<T> {
        return this.svc.createOne(input);
      }
    }

    if (RequirePrivileges)
      RequirePrivileges([
        (modelName || getResourceNameFromModel(Model)) as any,
        Action.Write,
      ])(GenericResolver);
    renameFunc(GenericResolver, `Generic${modelName}WriteResolver`);

    return GenericResolver as any;
  };
