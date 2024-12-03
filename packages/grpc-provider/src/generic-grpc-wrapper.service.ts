import { Inject, Injectable, OnModuleInit, Type } from "@nestjs/common";
import { ClientGrpc } from "@nestjs/microservices";
import { renameFunc } from "@bits/core/lib/utils";
import { promisify } from "./utils";

export function getDefaultGrpcServiceWrapper<
  Service extends object,
  Excluded extends keyof Service = never
>(packageToken: string, serviceName: string): Type<Omit<Service, Excluded>> {
  @Injectable()
  class GenericGrpcService implements OnModuleInit {
    public grpcSvc!: Service;

    @Inject(packageToken) private client!: ClientGrpc; // @InjectRepository(PushSubscriber) private subscriberRepository: Repository<PushSubscriber>,

    onModuleInit(): any {
      this.grpcSvc = promisify(this.client.getService<Service>(serviceName));
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      // const { findMany, ...rest } = this.grpcSvc;
      for (const methName of Object.keys(this.grpcSvc)) {
        if (!(GenericGrpcService as any).prototype[methName])
          (GenericGrpcService as any).prototype[methName] = (
            this.grpcSvc as any
          )[methName];
      }
    }
  }
  renameFunc(GenericGrpcService, serviceName);

  return GenericGrpcService as any;
}
