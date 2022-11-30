import { oqtoResources } from '../../../src/auth/oqto-resources';
import { Action } from './action.enum';

export type Privilege = [typeof oqtoResources[number] | string, Action];
