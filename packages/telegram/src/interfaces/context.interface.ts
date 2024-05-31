import type { UserEntity } from '../../user/user.entity';

import type { Context as BaseContext, Scenes } from 'telegraf';

export interface Context extends Scenes.SceneContext {}
export interface TgContext extends BaseContext {
  state: { user: UserEntity };
}
