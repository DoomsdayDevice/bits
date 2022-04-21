import { Inject, Injectable, OnModuleInit, Type } from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import { promisify } from '@bits/grpc/grpc.utils';
import { renameFunc } from '@bits/bits.utils';
import { transformAndValidate } from '@bits/dto.utils';

export interface IGrpcService<T = any> {
  findOne(opts: { id: string }): Promise<T>;
  findMany(input: any): Promise<{ nodes: T[] }>;
}

export function getGenericGrpcWrapper<Service extends IGrpcService, T>(
  packageToken: string,
  serviceName: string,
  Model: Type<T>,
): Type<Service> {
  @Injectable()
  class GenericGrpcService implements OnModuleInit {
    private svc!: Service;

    constructor(
      @Inject(packageToken) private client: ClientGrpc, // @InjectRepository(PushSubscriber) private subscriberRepository: Repository<PushSubscriber>,
    ) {}

    onModuleInit(): any {
      this.svc = promisify(this.client.getService<Service>(serviceName));
      Object.assign(this, this.svc);

      (this as any).findMany = async function (input: any) {
        const many = await this.svc.findMany(input);
        const trans = transformAndValidate(Model, many.nodes);
        return { nodes: trans };
      };
    }

    // findOne(input: FindOneInput) {
    //   return this.svc.findOne(input);
    // }
    //
    // findMany(input: any) {
    //   const many = this.svc.findMany(input);
    //   console.log({ many });
    //   return many;
    // }
    //
    // createOne(input: CreateUserInput): Promise<User> {
    //   return this.svc.createOne(input);
    // }
  }
  renameFunc(GenericGrpcService, serviceName);

  return GenericGrpcService as any;
}
