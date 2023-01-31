import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';

export const getIpFromReq = (req: any) => {
  const { ip, headers } = req;
  const forwardIp = headers['x-forwarded-for'];
  const realIp = headers['x-real-ip'];

  let finalIp: string;

  if (ip.substr(0, 7) === '::ffff:') {
    finalIp = ip.substr(7);
    if (forwardIp || realIp) finalIp = forwardIp || realIp;
  } else finalIp = ip;

  return finalIp;
};

export const UserIp = createParamDecorator((data: unknown, context: ExecutionContext) => {
  const ctx = GqlExecutionContext.create(context);
  return getIpFromReq(ctx.getContext().req);
});
