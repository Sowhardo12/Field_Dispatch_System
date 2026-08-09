import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import { ExceptionsHandler } from "@nestjs/core/exceptions/exceptions-handler";
import { ExecutionContextHost } from "@nestjs/core/helpers/execution-context-host";
export const CurrentUser = createParamDecorator((data:string|undefined,ctx:ExecutionContext)=>{
  const request = ctx.switchToHttp().getRequest();
  if(!request.use) return null;
  return data ? request.user[data] : request.user;
}
)