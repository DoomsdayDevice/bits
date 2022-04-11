import { ValueReflector } from '../grpc/reflector';
import { GRPC_MESSAGE_KEY } from '../grpc/decorators/decorators';

export const CRUD_SVC_FIELD_KEY = 'CRUD_SVC_FIELD_KEY';
export const crudServiceReflector = new ValueReflector(CRUD_SVC_FIELD_KEY);
