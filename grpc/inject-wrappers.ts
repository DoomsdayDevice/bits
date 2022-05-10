// eslint-disable-next-line import/no-extraneous-dependencies
import { common, wrappers } from 'protobufjs';
import IStringValue = common.IStringValue;

export function injectWrappers() {
  //
  wrappers['.google.protobuf.Timestamp'] = {
    fromObject: function (value: any) {
      return {
        seconds: value.getTime() / 1000,
        nanos: (value.getTime() % 1000) * 1e6,
      };
    },
    toObject: function (message: { seconds: number; nanos: number }, options: any) {
      return new Date(message.seconds * 1000 + message.nanos / 1e6);
    },
  } as any; // <- dirty workaround :D

  wrappers['.google.protobuf.StringValue'] = {
    fromObject: function (value: string) {
      return {
        value,
      };
    },
    toObject: function (message: IStringValue, options: any) {
      return message.value;
    },
  } as any; // <- dirty workaround :D
}
