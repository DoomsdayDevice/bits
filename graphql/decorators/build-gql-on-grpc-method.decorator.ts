import { Args, Mutation, Query } from '@nestjs/graphql';
import { CurrentUser } from '@bits/auth/current-user.decorator';
import { getProtoRoot } from '@bits/graphql/gql-crud/get-or-create-model-by-name';
import { CORE_PACKAGE, grpcProtoPaths } from '@core/grpc/clients';
import { grpcToGqlConverter } from '@core/grpc/constants';
import { UsePipes, ValidationPipe } from '@nestjs/common';
import { transformAndValidate } from '@bits/dto.utils';

const PARAM_METADATA_KEY = 'design:paramtypes';

export type ProxyMethodConfig = {
  methodName: string;
  serviceName: string;
  servicePropName: string;
  isMutation?: boolean;
};

export const BuildGqlOnGrpcMethodDecorator =
  ({
    methodName,
    serviceName,
    servicePropName,
    isMutation = false,
  }: ProxyMethodConfig): ClassDecorator =>
  targetResolverCls => {
    // Obtain a message type
    const protoPath = grpcProtoPaths[CORE_PACKAGE];
    const protoRoot = getProtoRoot(protoPath);
    const service = protoRoot.lookupService(serviceName);
    const method = service.methods[methodName];
    const { requestType, responseType } = method;

    // const input = protoRoot.lookupType(requestType);
    // INPUT
    const [Input, withUser, paging] = grpcToGqlConverter.convertInputTypeToGql(requestType);

    // const withUserId = async function (input: any, user: any) {
    //   return this[servicePropName][methodName](input);
    // };
    const ReturnType = grpcToGqlConverter.convertAndPopulateGrpcTypeToGql(responseType);

    if (withUser)
      targetResolverCls.prototype[methodName] = async function (args: any, user: any) {
        const ans = await this[servicePropName][methodName]({
          ...args.input,
          userId: user.id,
          paging: paging && args.paging,
        });
        return transformAndValidate(ReturnType, ans);
      };
    else
      targetResolverCls.prototype[methodName] = async function (args: any) {
        const ans = await this[servicePropName][methodName](args.input);
        return transformAndValidate(ReturnType, ans);
      };

    // UsePipes(new ValidationPipe({ expectedType: ActivityMessageSent }))
    // const meta = Reflect.getMetadata(metadataKey, target.prototype, 'number');
    Reflect.defineMetadata(
      PARAM_METADATA_KEY,
      [Input, null],
      targetResolverCls.prototype,
      methodName,
    );

    // RESPONSE

    Args({ type: () => Input }, new ValidationPipe())(targetResolverCls.prototype, methodName, 0);
    if (withUser) CurrentUser()(targetResolverCls.prototype, methodName, 1);

    const descriptor = Object.getOwnPropertyDescriptor(targetResolverCls.prototype, methodName);

    // Validate return
    (isMutation ? Mutation : Query)(() => ReturnType)(
      targetResolverCls.prototype,
      methodName,
      descriptor!,
    );
  };
