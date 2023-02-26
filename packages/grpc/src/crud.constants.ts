import { ValueReflector } from "../../backend/src/utils/reflectors";
import { GRPC_MESSAGE_KEY } from "./common/variables";

export const CRUD_SVC_FIELD_KEY = "CRUD_SVC_FIELD_KEY";
export const crudServiceReflector = new ValueReflector(CRUD_SVC_FIELD_KEY);
