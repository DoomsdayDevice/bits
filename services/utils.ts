import { Transform, TransformFnParams } from 'class-transformer';

export const OptionalInject = (token: any) => {
  if (token) return Inject(token);
  return () => {};
};

export const RemoveTrailingSpace = () => Transform(({ value }: TransformFnParams) => value?.trim());
