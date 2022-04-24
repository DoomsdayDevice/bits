import { wrappers } from 'protobufjs';

export function injectWrappers() {
  //
  wrappers['.google.protobuf.Timestamp'] = {
    fromObject: function (value) {
      return {
        seconds: value.getTime() / 1000,
        nanos: (value.getTime() % 1000) * 1e6,
      };
    },
    toObject: function (message: { seconds: number; nanos: number }, options) {
      return new Date(message.seconds * 1000 + message.nanos / 1e6);
    },
  } as any; // <- dirty workaround :D
}
