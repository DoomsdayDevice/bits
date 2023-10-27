import { DynamicModule, Module, Type } from "@nestjs/common";
import { validateConfig } from "@bits/backend";

export class ConfigModule {
  static forFeature<C extends Record<string, any>, TC extends Type<C>>(
    token: TC,
    cfgFactory: () => C
  ): DynamicModule {
    const cfg = cfgFactory();
    validateConfig(token, cfg);

    @Module({
      providers: [{ provide: token, useValue: cfg }],
      exports: [token],
    })
    // eslint-disable-next-line @typescript-eslint/no-shadow
    class ConfigModule {}
    return { module: ConfigModule, global: true };
  }
}
