import { Controller, Inject, Type } from "@nestjs/common";
import {
  IGrpcFindManyInput,
  IGrpcFindManyResponse,
  ObjectLiteral,
} from "@bits/core";
import {
  convertGrpcFilterToService,
  IReadableCrudService,
} from "@bits/backend";
import { FindByIdInput } from "../grpc.dto";
import { IGrpcReadController } from "../types/controller";
import { GrpcMethodDef, GrpcServiceDef } from "../decorators";
import { getOrCreateConnection, getOrCreateFindManyInput } from "../dtos";
import { convertGrpcOrderByToTypeorm } from "@bits/db";

export type AnyConstructor<A = object> = new (...input: any[]) => A;

export function ReadableGrpcController<
  M extends ObjectLiteral,
  B extends AnyConstructor,
  Enums
>(
  ModelCls: Type<M>,
  ServiceCls: Type<IReadableCrudService<M>>,
  defineService = true,
  Base: B = class {} as any,
  FindOneInputDTO?: Type,
  isSimple = false
): Type<IGrpcReadController<M, Enums> & InstanceType<B>> {
  const FindMany = getOrCreateFindManyInput(
    ModelCls,
    isSimple ? { paging: false, sorting: false, filter: false } : undefined
  );
  const FindManyResp = getOrCreateConnection(ModelCls);
  const FinalFindOneInput = FindOneInputDTO || FindByIdInput;

  @Controller()
  class ModelController extends Base implements IGrpcReadController<M, Enums> {
    @Inject(ServiceCls) private readSvc!: IReadableCrudService<M>;
    // @Inject(Logger) private logger: Logger;

    @GrpcMethodDef({
      requestType: () => FinalFindOneInput,
      responseType: () => ModelCls,
    })
    async findOne(input: FindByIdInput): Promise<M> {
      return this.readSvc.findOne(input as any);
    }

    @GrpcMethodDef({
      requestType: () => FindMany,
      responseType: () => FindManyResp,
    })
    async findMany(
      input: IGrpcFindManyInput<M, Enums>
    ): Promise<IGrpcFindManyResponse<M>> {
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
