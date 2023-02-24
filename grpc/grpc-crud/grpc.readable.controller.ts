import { Controller, Inject, Type } from '@nestjs/common';
import {
  FindByIdInput,
  GrpcMethodDef,
  GrpcServiceDef,
  IGrpcFindManyInput,
  IGrpcFindManyResponse,
  IGrpcReadController,
} from '@bits/grpc';
import { getOrCreateFindManyInput } from '@bits/grpc/grpc-crud/dto/default-find-many-input.grpc';
import { IReadableCrudService } from '@bits/services/interface.service';
import { getOrCreateConnection } from '@bits/grpc/grpc-crud/dto/default-connection.grpc';
import { ObjectLiteral } from 'typeorm';
import { convertGrpcFilterToService, convertGrpcOrderByToTypeorm } from '@bits/utils/conversions';

export type AnyConstructor<A = object> = new (...input: any[]) => A;

export function ReadableGrpcController<M extends ObjectLiteral, B extends AnyConstructor>(
  ModelCls: Type<M>,
  ServiceCls: Type<IReadableCrudService<M>>,
  defineService = true,
  Base: B = class {} as any,
  FindOneInputDTO?: Type,
  isSimple = false,
): Type<IGrpcReadController<M> & InstanceType<B>> {
  const FindMany = getOrCreateFindManyInput(ModelCls, { isSimple });
  const FindManyResp = getOrCreateConnection(ModelCls);
  const FinalFindOneInput = FindOneInputDTO || FindByIdInput;

  @Controller()
  class ModelController extends Base implements IGrpcReadController<M> {
    @Inject(ServiceCls) private readSvc!: IReadableCrudService<M>;
    // @Inject(Logger) private logger: Logger;

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
      const order = input.sorting && convertGrpcOrderByToTypeorm(input.sorting); // TODO this sorting isn't added

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
