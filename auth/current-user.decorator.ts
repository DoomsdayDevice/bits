import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';

export const CurrentUser = createParamDecorator((data: unknown, context: ExecutionContext) => {
  if (context.getType() === 'http') {
    const request = context.switchToHttp().getRequest();
    return request.user;
  }
  const ctx = GqlExecutionContext.create(context as ExecutionContext);
  if (Array.isArray(context) && context[2]) return context[2].req.user;
  const c = ctx.getContext();
  return c.req?.user || c.extra?.user;
});

export const UserIp = createParamDecorator((data: unknown, context: ExecutionContext) => {
  const ctx = GqlExecutionContext.create(context);
  let { ip } = ctx.getContext().req;
  if (ip.substr(0, 7) === '::ffff:') {
    ip = ip.substr(7);
  }
  return ip;
});
