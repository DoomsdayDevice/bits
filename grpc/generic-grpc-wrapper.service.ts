import { Inject, Injectable, OnModuleInit, Type } from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import { promisify } from '@bits/grpc/grpc.utils';
import { renameFunc } from '@bits/bits.utils';
import { IGrpcService } from '@bits/grpc/grpc.interface';
import { Connection } from '@bits/graphql/gql-crud/gql-crud.interface';
import { IGrpcFindManyInput } from '@bits/grpc/grpc-crud/grpc-controller.interface';
import { transformAndValidate } from '@bits/dto.utils';

export type WrappedGrpcService<Svc, From, To> = Omit<Svc, 'findMany' | 'createOne'> &
  IGrpcService<To> & {
    grpcSvc: Svc;
    validate(input: From): To;
    validate(input: From[]): To[];
  };

/**
 * создает и оборачивает gRPC сервис
 */
export function getDefaultGrpcServiceWrapper<
  Service extends IGrpcService<T>,
  T extends object,
  DTO extends object = T,
  Excluded extends keyof Service = never,
>(
  packageToken: string,
  serviceName: string,
  DTOCls?: Type<DTO>,
): Type<Omit<WrappedGrpcService<Service, T, DTO>, Excluded>> {
  @Injectable()
  class GenericGrpcService implements OnModuleInit {
    public grpcSvc!: Service;

    constructor(
      @Inject(packageToken) private client: ClientGrpc, // @InjectRepository(PushSubscriber) private subscriberRepository: Repository<PushSubscriber>,
    ) {}

    onModuleInit(): any {
      this.grpcSvc = promisify(this.client.getService<Service>(serviceName));
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      // const { findMany, ...rest } = this.grpcSvc;
      for (const methName of Object.keys(this.grpcSvc)) {
        if (!(GenericGrpcService as any).prototype[methName])
          (GenericGrpcService as any).prototype[methName] = (this.grpcSvc as any)[methName];
      }
    }

    validate(input: T): DTO;
    validate(input: T[]): DTO[];
    validate(input: T | T[]): DTO | DTO[] {
      if (DTOCls) return transformAndValidate(DTOCls, input as any);
      else return input as DTO;
    }

    // findOne(input: FindOneInput) {
    //   return this.svc.findOne(input);
    // }

    async findMany(input: IGrpcFindManyInput<T>): Promise<Connection<DTO>> {
      const many = await this.grpcSvc.findMany(input as any);
      const valid = this.validate(many.nodes);
      return { ...many, nodes: valid };
    }

    async createOne(input: any): Promise<DTO> {
      if (DTOCls) {
        // TODO add validation with CreateOneDTO
        const newOne = transformAndValidate(DTOCls, input as any);
        return transformAndValidate(DTOCls, (await this.grpcSvc.createOne(newOne)) as any);
      }
      return (await this.grpcSvc.createOne(input)) as DTO;
    }
  }
  renameFunc(GenericGrpcService, serviceName);

  return GenericGrpcService as any;
}
