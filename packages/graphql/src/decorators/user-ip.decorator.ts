import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import { GqlExecutionContext } from "@nestjs/graphql";
import { getIpFromReq } from "@bits/backend";

export const UserIp = createParamDecorator(
  (data: unknown, context: ExecutionContext) => {
    const ctx = GqlExecutionContext.create(context);
    return getIpFromReq(ctx.getContext().req);
  }
);
