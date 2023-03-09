import { common, IWrapper } from "protobufjs";
import IStringValue = common.IStringValue;
import IBoolValue = common.IBoolValue;

export function injectGrpcWrappers(wrappers: { [k: string]: IWrapper }) {
  wrappers[".google.protobuf.Timestamp"] = {
    fromObject: function (value: Date) {
      return {
        seconds: Math.trunc(value.getTime() / 1000),
        nanos: (value.getTime() % 1000) * 1e6,
      };
    },
    toObject: function (
      message: { seconds: number; nanos: number },
      options: any
    ) {
      return new Date(message.seconds * 1000 + message.nanos / 1e6);
    },
  } as any; // <- dirty workaround :D

  wrappers[".google.protobuf.StringValue"] = {
    fromObject: function (value: string) {
      return {
        value,
      };
    },
    toObject: function (message: IStringValue, options: any) {
      return message.value;
    },
  } as any;

  wrappers[".google.protobuf.BoolValue"] = {
    fromObject: function (value: boolean) {
      return {
        value,
      };
    },
    toObject: function (message: IBoolValue, options: any) {
      return message.value;
    },
  } as any;
}
