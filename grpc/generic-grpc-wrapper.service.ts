import { DynamicModule, Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import { CreateUserInput, FindManyInput, User } from '@apis/core';
import { promisify } from '@bits/grpc/grpc.utils';
import { FindOneInput } from '@bits/graphql/gql-crud/gql-crud.interface';

export interface IService {
  findOne(opts: { id: string }): any;
  findMany(input: FindManyInput): any;
  createOne(input: CreateUserInput): any;
}

export function getGenericGrpcWrapper<Service extends IService>(
  packageToken: string,
  serviceName: string,
): any {
  @Injectable()
  class GenericGrpcService implements OnModuleInit {
    private svc!: Service;

    constructor(
      @Inject(packageToken) private client: ClientGrpc, // @InjectRepository(PushSubscriber) private subscriberRepository: Repository<PushSubscriber>,
    ) {}

    onModuleInit(): any {
      this.svc = promisify(this.client.getService<Service>(serviceName));
    }

    findOne(input: FindOneInput) {
      return this.svc.findOne(input);
    }

    findMany(input: FindManyInput) {
      return this.svc.findMany(input);
    }

    createOne(input: CreateUserInput): Promise<User> {
      return this.svc.createOne(input);
    }
  }

  return GenericGrpcService;
}
