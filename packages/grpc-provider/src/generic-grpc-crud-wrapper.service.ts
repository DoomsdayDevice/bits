import { Inject, Injectable, OnModuleInit, Type } from "@nestjs/common";
import { ClientGrpc } from "@nestjs/microservices";
import { QueryDeepPartialEntity } from "typeorm/query-builder/QueryPartialEntity";
import { upperFirst } from "lodash";
import {
  generateFieldMask,
  IConnection,
  IGrpcService,
  ObjectLiteral,
  renameFunc,
} from "@bits/core";
import {
  ICrudService,
  IFindManyServiceInput,
  IFindOneOptions,
  IFindOptionsWhere,
  transformAndValidate,
} from "@bits/backend";
import { convertServiceInputToGrpc } from "@bits/backend/lib/conversions";
import { promisify } from "./utils";
import { inspect } from "util";

export type WrappedGrpcService<
  Svc extends IGrpcService<From>,
  From extends ObjectLiteral,
  To extends ObjectLiteral
> = Omit<
  Svc,
  "findMany" | "createOne" | "findOne" | "updateOne" | "deleteOne"
> &
  ICrudService<To> & {
    grpcSvc: Svc;
    validate(input: From): To;
    validate(input: From[]): To[];
  };

interface Input<To> {
  packageToken: string;
  serviceName?: string;
  DTOCls: Type<To>;
}

/**
 * создает и оборачивает gRPC сервис
 */
export function getOrCreateDefaultGrpcCrudServiceWrapper<
  Service extends IGrpcService<From>,
  From extends object,
  To extends object = From,
  Excluded extends keyof Service = never
>({
  packageToken,
  DTOCls,
  serviceName = `${upperFirst(DTOCls.name)}Service`,
}: Input<To>): Type<Omit<WrappedGrpcService<Service, From, To>, Excluded>> {
  @Injectable()
  class GenericGrpcService implements OnModuleInit, ICrudService<To> {
    public grpcSvc!: Service;
    _writeRepo: any;
    _readRepo: any;

    private primaryColName: keyof To;

    constructor(
      @Inject(packageToken) private client: ClientGrpc // @InjectRepository(PushSubscriber) private subscriberRepository: Repository<PushSubscriber>,
    ) {
      const namedModels = ["RoleDto", "Motivation"];
      this.primaryColName = namedModels.includes(DTOCls.name as any)
        ? ("name" as any)
        : ("id" as any);
    }

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

    validate(input: From): To;
    validate(input: From[]): To[];
    validate(input: From | From[]): To | To[] {
      if (DTOCls) return transformAndValidate(DTOCls, input as any);
      return input as any;
    }

    // findOne(input: FindOneInput) {
    //   return this.svc.findOne(input);
    // }

    async findMany(input: IFindManyServiceInput<To>): Promise<To[]> {
      const filter = convertServiceInputToGrpc(
        this.convertDtoInputToGrpc(input)
      );
      const many = await this.grpcSvc.findMany(filter as any);
      const valid = this.validate(many.nodes);
      return valid;
    }

    async findManyAndCount(
      input?: IFindManyServiceInput<To>
    ): Promise<IConnection<To>> {
      const many = await this.grpcSvc.findMany(
        convertServiceInputToGrpc(input as any)
      );
      const valid = this.validate(many.nodes);

      return { ...many, nodes: valid };
    }

    async createOne(input: any): Promise<To> {
      if (DTOCls) {
        // TODO add validation with CreateOneDTO
        const newOne = transformAndValidate(DTOCls, input as any);
        return transformAndValidate(
          DTOCls,
          (await this.grpcSvc.createOne(newOne)) as any
        );
      }
      return (await this.grpcSvc.createOne(input)) as To;
    }

    async deleteOne(id: string | IFindOptionsWhere<To>): Promise<boolean> {
      await this.grpcSvc.deleteOne(id);
      return true;
    }

    async updateOne(
      idOrConditions: string | IFindOptionsWhere<To>,
      partialEntity: QueryDeepPartialEntity<To>
      // ...options: any[]
    ): Promise<To> {
      const update: any = { ...partialEntity, id: idOrConditions };
      const updateMask = { paths: generateFieldMask(update) };

      const updated = await this.grpcSvc.updateOne({
        update,
        updateMask,
      });
      return updated as To;
    }

    async findOne(
      id: IFindOneOptions<To> | IFindOptionsWhere<To>,
      options?: IFindOneOptions<To>
    ): Promise<To> {
      const where = (id as IFindOneOptions<To>).where || id;
      return this.grpcSvc.findOne(where as any) as any;
    }

    async count(filter?: IFindManyServiceInput<To>): Promise<number> {
      const { totalCount } = await this.grpcSvc.findMany(filter as any);
      return totalCount;
    }

    convertDtoInputToGrpc(
      input: IFindManyServiceInput<To>
    ): IFindManyServiceInput<From> {
      return input as any;
    }

    getPrimaryColumnName() {
      return this.primaryColName;
    }
  }
  renameFunc(GenericGrpcService, serviceName);

  return GenericGrpcService as any;
}
