import { Inject, Injectable, OnModuleInit, Type } from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import { CreateUserInput } from '@apis/core';
import { promisify } from '@bits/grpc/grpc.utils';

export interface IService {
  findOne(opts: { id: string }): any;
  findMany(input: any): any;
  createOne(input: CreateUserInput): any;
}

export function getGenericGrpcWrapper<Service extends IService>(
  packageToken: string,
  serviceName: string,
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
    }

    // findOne(input: FindOneInput) {
    //   return this.svc.findOne(input);
    // }
    //
    // findMany(input: FindManyInput) {
    //   return this.svc.findMany(input);
    // }
    //
    // createOne(input: CreateUserInput): Promise<User> {
    //   return this.svc.createOne(input);
    // }
  }

  return GenericGrpcService as any;
}
