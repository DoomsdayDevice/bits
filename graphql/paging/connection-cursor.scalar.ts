import { GraphQLScalarType, ValueNode, Kind } from 'graphql';

export const ConnectionCursorScalar = new GraphQLScalarType<any, any>({
  name: 'ConnectionCursor',
  description: 'Cursor for paging through collections',

  parseValue(value: unknown): string {
    return value as string;
  },

  serialize(value: unknown): string {
    return value as string;
  },

  parseLiteral(ast: ValueNode): string | null {
    if (ast.kind === Kind.STRING) {
      return ast.value;
    }
    return null;
  },
});
