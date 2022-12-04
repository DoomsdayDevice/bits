import { Controller, Inject, Type } from '@nestjs/common';
import {
  IGrpcFindManyInput,
  IGrpcFindManyResponse,
  IGrpcReadController,
} from './grpc-controller.interface';
import { GrpcMethodDef } from '../decorators/method.decorator';
import { GrpcServiceDef } from '../decorators/service.decorator';
import { FindByIdInput } from '../grpc.dto';
import { getOrCreateFindManyInput } from '@bits/grpc/grpc-crud/dto/default-find-many-input.grpc';
import { IReadableCrudService } from '@bits/services/interface.service';
import { getOrCreateConnection } from '@bits/grpc/grpc-crud/dto/default-connection.grpc';
import { Logger } from '../../../../src/infrastructure/logger/logger';
import { convertGrpcFilterToService, convertGrpcOrderByToTypeorm } from '@bits/bits.utils';

export type AnyConstructor<A = object> = new (...input: any[]) => A;

export function ReadableGrpcController<M, B extends AnyConstructor>(
  ModelCls: Type<M>,
  ServiceCls: Type<IReadableCrudService<M>>,
  defineService = true,
  Base: B = class {} as any,
  FindOneInputDTO?: Type,
  isSimple = false,
): Type<IGrpcReadController<M> & InstanceType<B>> {
  const FindMany = getOrCreateFindManyInput(ModelCls, isSimple);
  const FindManyResp = getOrCreateConnection(ModelCls);
  const FinalFindOneInput = FindOneInputDTO || FindByIdInput;

  @Controller()
  class ModelController extends Base implements IGrpcReadController<M> {
    @Inject(ServiceCls) private readSvc: IReadableCrudService<M>;
    @Inject(Logger) private logger: Logger;

    @GrpcMethodDef({ requestType: () => FinalFindOneInput, responseType: () => ModelCls })
    async findOne(input: FindByIdInput): Promise<M> {
      return this.readSvc.findOne(input as any);
    }

    @GrpcMethodDef({
      requestType: () => FindMany,
      responseType: () => FindManyResp,
    })
    async findMany(input: IGrpcFindManyInput<M>): Promise<IGrpcFindManyResponse<M>> {
      const filter = convertGrpcFilterToService(input.filter);
      // const ans = await convertGrpcFilterToUcast(input.filter).getMany();
      const order = input.sorting && convertGrpcOrderByToTypeorm(input.sorting.values); // TODO this sorting isn't added

      console.log({ o: input.paging?.offset, take: input.paging?.limit });
      const res = await this.readSvc.findManyAndCount({
        where: filter,
        order,
        skip: input.paging?.offset,
        take: input.paging?.limit,
      });
      return res;
    }
  }

  if (defineService) GrpcServiceDef(`${ModelCls.name}Service`)(ModelController);
  return ModelController as any;
}
