export interface ObjectLiteral {
    [key: string]: any;
}

export interface Class<T = any> extends Function {
    new (...args: any[]): T;
}

type UnpackedPromise<T> = T extends Promise<infer U> ? U : T;
type GenericFunction<TS extends any[], R> = (...args: TS) => R;

export type Promisify<T> = {
    [K in keyof T]: T[K] extends GenericFunction<infer TS, infer R>
        ? (...args: TS) => Promise<UnpackedPromise<R>>
        : never;
};

export type Maybe<T> = T | null;

export interface IConnection<T> {
    totalCount: number;
    nodes: T[];
}

export type Defined<T> = T extends null | undefined ? never : T;

export type DeepPartial<T> = T extends object ? {
    [P in keyof T]?: DeepPartial<T[P]>;
} : T;
