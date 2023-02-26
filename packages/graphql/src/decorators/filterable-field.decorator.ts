import { Field, ReturnTypeFunc } from "@nestjs/graphql";
import { FilterableFieldOptions } from "../types";
import { Type } from "@nestjs/common";
import { filterableFieldReflector } from "../utils/filter-comparison.factory";

export function FilterableField(): PropertyDecorator & MethodDecorator;
export function FilterableField(
  options: FilterableFieldOptions
): PropertyDecorator & MethodDecorator;
export function FilterableField(
  returnTypeFunction?: ReturnTypeFunc,
  options?: FilterableFieldOptions
): PropertyDecorator & MethodDecorator;
export function FilterableField(
  returnTypeFuncOrOptions?: ReturnTypeFunc | FilterableFieldOptions,
  maybeOptions?: FilterableFieldOptions
): MethodDecorator | PropertyDecorator {
  let returnTypeFunc: ReturnTypeFunc | undefined;
  let advancedOptions: FilterableFieldOptions | undefined;
  if (typeof returnTypeFuncOrOptions === "function") {
    returnTypeFunc = returnTypeFuncOrOptions;
    advancedOptions = maybeOptions;
  } else if (typeof returnTypeFuncOrOptions === "object") {
    advancedOptions = returnTypeFuncOrOptions;
  } else if (typeof maybeOptions === "object") {
    advancedOptions = maybeOptions;
  }
  return <D>(
    // eslint-disable-next-line @typescript-eslint/ban-types
    target: Object,
    propertyName: string | symbol,
    descriptor: TypedPropertyDescriptor<D>
  ): TypedPropertyDescriptor<D> | void => {
    const Ctx = Reflect.getMetadata(
      "design:type",
      target,
      propertyName
    ) as Type<unknown>;
    filterableFieldReflector.append(target.constructor as Type<unknown>, {
      propertyName: propertyName.toString(),
      target: Ctx,
      returnTypeFunc,
      advancedOptions,
    });
    if (returnTypeFunc) {
      return Field(returnTypeFunc, advancedOptions)(
        target,
        propertyName,
        descriptor
      );
    }
    if (advancedOptions) {
      return Field(advancedOptions)(target, propertyName, descriptor);
    }
    return Field()(target, propertyName, descriptor);
  };
}
