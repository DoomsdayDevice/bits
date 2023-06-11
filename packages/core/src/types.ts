import { F } from 'ts-toolbelt';

export interface ObjectLiteral {
  [key: string]: any;
}

export interface Class<T = any> extends Function {
  new (...args: any[]): T;
}

type User = any;

type UnpackedPromise<T> = T extends Promise<infer U> ? U : T;
type GenericFunction<TS extends any[], R> = (...args: TS) => R;

export type Functionify<T> = {
  [K in keyof T]: T[K] extends GenericFunction<infer TS, infer R>
    ? never
    : (...args: any) => Promise<UnpackedPromise<T[K]>> | UnpackedPromise<T[K]>;
};

export type Promisify<T> = {
  [K in keyof T]: T[K] extends GenericFunction<infer TS, infer R>
    ? (...args: TS) => Promise<UnpackedPromise<R>> | UnpackedPromise<R>
    : never;
};

export type Userify<T> = {
  [K in keyof T]: T[K] extends (...a: any) => infer U
    ? (user: User, ...a: Parameters<T[K]>) => U
    : never;
};

export type IGqlSubEvent<T> = AsyncIterator<string, T>;
export interface UserRef {
  userId: string;
}

export type DeuserifyWithInput<T> = {
  [K in keyof T]: T[K] extends (user: User, input: infer I) => infer U
    ? (input: I & UserRef) => U
    : never;
};

export type Subify<T> = {
  [K in keyof T]: T[K] extends (...a: any) => infer U
    ? (...a: Parameters<T[K]>) => IGqlSubEvent<U>
    : never;
};

export type Deuserify<T> = {
  [K in keyof T]: T[K] extends (user: User, ...a: infer Params) => infer U
    ? (...a: Params) => U
    : never;
};

export type Maybe<T> = T | null;

export interface IConnection<T> {
  totalCount: number;
  nodes: T[];
}

export type Defined<T> = T extends null | undefined ? never : T;

export type DeepPartial<T> = T extends object
  ? {
      [P in keyof T]?: DeepPartial<T[P]>;
    }
  : T;

export type UUID = `${string}-${string}-${string}-${string}-${string}`;
