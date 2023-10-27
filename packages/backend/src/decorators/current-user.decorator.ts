import { createParamDecorator, ExecutionContext } from "@nestjs/common";

export const CurrentUser = createParamDecorator(
  (data: unknown, context: ExecutionContext) => {
    if (context.getType() === "http") {
      const request = context.switchToHttp().getRequest();
      return request.user;
    }
    throw new Error("Expected http context");
  }
);
