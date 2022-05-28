import { Inject, Type } from '@nestjs/common';

export const getRepositoryToken = (Model: Type) => `${Model.name}Repo`;

export const InjectRepo = (Model: Type): ReturnType<typeof Inject> =>
  Inject(getRepositoryToken(Model));
