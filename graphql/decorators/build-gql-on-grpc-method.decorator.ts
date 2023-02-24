import { Args, InputType, Mutation, Query } from '@nestjs/graphql';
import { CurrentUser } from '@bits/auth/current-user.decorator';
import {
  getProtoRoot,
  GrpcProtoToGqlConverter,
} from '@bits/graphql/gql-crud/get-or-create-model-by-name';
import { CORE_PACKAGE, grpcProtoPaths } from '@core/grpc/clients';
import { grpcToGqlConverter, skippedTypes } from '@core/grpc/constants';

const PARAM_METADATA_KEY = 'design:paramtypes';

export type ProxyMethodConfig = {
  methodName: string;
  serviceName: string;
  servicePropName: string;
  isMutation: boolean;
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
    @InputType(requestType)
    class Input {}
    grpcToGqlConverter.populateGqlModelByGrpcData(Input, requestType, requestType);

    targetResolverCls.prototype[methodName] = async function (input: any, user: any) {
      const ans = await this[servicePropName][methodName](input);
      return ans;
    };
    // const meta = Reflect.getMetadata(metadataKey, target.prototype, 'number');
    Reflect.defineMetadata(
      PARAM_METADATA_KEY,
      [Input, null],
      targetResolverCls.prototype,
      methodName,
    );

    // RESPONSE
    const isOneOf = protoRoot.lookupType(responseType);

    const ReturnType = grpcToGqlConverter.convertAndPopulateGrpcTypeToGql(responseType);

    Args('input', { type: () => Input })(targetResolverCls.prototype, methodName, 0);
    CurrentUser()(targetResolverCls.prototype, methodName, 1);

    const descriptor = Object.getOwnPropertyDescriptor(targetResolverCls.prototype, methodName);
    (isMutation ? Mutation : Query)(() => ReturnType)(
      targetResolverCls.prototype,
      methodName,
      descriptor!,
    );
  };
