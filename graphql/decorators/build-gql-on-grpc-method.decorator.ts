import * as protobuf from 'protobufjs';
import { Args, Field, InputType, Int, Mutation } from '@nestjs/graphql';
import { CurrentUser } from '@bits/auth/current-user.decorator';

const root = protobuf.loadSync('libs/common/proto/core.proto');

const PARAM_METADATA_KEY = 'design:paramtypes';

export const BuildGqlOnGrpcMethodDecorator =
  (methodName: string, serviceName: string, servicePropName: string): ClassDecorator =>
  target => {
    // Obtain a message type
    const test = root.lookupService(serviceName);
    const method = test.methods[methodName];
    const { requestType, responseType } = method;

    const input = root.lookupType(requestType);

    @InputType(requestType)
    class Input {}
    for (const f of Object.keys(input.fields)) {
      // Reflect.defineMetadata(PARAM_METADATA_KEY, String, target.prototype, f);
      Field(() => Int, { name: f })(Input.prototype, f);
    }
    target.prototype[methodName] = async function (input: any, user: any) {
      const ans = await this[servicePropName][methodName](input);
      return ans;
    };
    // const meta = Reflect.getMetadata(metadataKey, target.prototype, 'number');

    let ReturnType: any;
    if (responseType === 'google.protobuf.BoolValue') ReturnType = Boolean;
    else throw new Error('Proto type not specified');
    Reflect.defineMetadata(PARAM_METADATA_KEY, [Input, null], target.prototype, methodName);

    const desc = Object.getOwnPropertyDescriptor(target.prototype, methodName);
    Args('input', { type: () => Input })(target.prototype, methodName, 0);
    CurrentUser()(target.prototype, methodName, 1);

    Mutation(() => ReturnType)(target.prototype, methodName, desc!);
  };
