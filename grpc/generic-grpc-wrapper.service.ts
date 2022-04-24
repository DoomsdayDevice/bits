import { Inject, Injectable, OnModuleInit, Type } from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import { promisify } from '@bits/grpc/grpc.utils';
import { renameFunc } from '@bits/bits.utils';
import { IGrpcService } from '@bits/grpc/grpc.interface';
import { Connection } from '@bits/graphql/gql-crud/gql-crud.interface';
import { IGrpcFindManyInput } from '@bits/grpc/grpc-crud/grpc-controller.interface';
import { transformAndValidate } from '@bits/dto.utils';

type Transformed<Svc, To> = Omit<Svc, 'findMany'> & IGrpcService<To>;

type Func<T> = (args: T | T[]) => unknown;

/**
 * создает и оборачивает gRPC сервис
 */
export function getDefaultGrpcServiceWrapper<
  Service extends IGrpcService<T>,
  T extends object,
  DTO extends object = T,
>(packageToken: string, serviceName: string, DTOCls?: Type<DTO>): Type<Transformed<Service, DTO>> {
  @Injectable()
  class GenericGrpcService implements OnModuleInit {
    private grpcSvc!: Service;

    constructor(
      @Inject(packageToken) private client: ClientGrpc, // @InjectRepository(PushSubscriber) private subscriberRepository: Repository<PushSubscriber>,
    ) {}

    onModuleInit(): any {
      this.grpcSvc = promisify(this.client.getService<Service>(serviceName));
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { findMany, ...rest } = this.grpcSvc;
      Object.assign(this, rest);
    }

    // findOne(input: FindOneInput) {
    //   return this.svc.findOne(input);
    // }

    async findMany(input: IGrpcFindManyInput<T>): Promise<Connection<DTO>> {
      const many = await this.grpcSvc.findMany(input as any);
      if (DTOCls) {
        const trans = transformAndValidate(DTOCls, many.nodes as any);
        return { ...many, nodes: trans };
      }
      return many as any;
    }
    //
    // createOne(input: CreateUserInput): Promise<User> {
    //   return this.svc.createOne(input);
    // }
  }
  renameFunc(GenericGrpcService, serviceName);

  return GenericGrpcService as any;
}
