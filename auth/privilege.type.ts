import { OQTO_RESOURCE_NAMES } from '../../../src/auth/oqto-resources';
import { Action } from './action.enum';

export type Privilege = [typeof OQTO_RESOURCE_NAMES[number] | string, Action];
