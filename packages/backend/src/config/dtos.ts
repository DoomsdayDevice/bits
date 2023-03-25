import {
  IsBoolean,
  IsEmail,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
} from "class-validator";
import exp from "constants";

export enum Environment {
  Development = "development",
  Production = "production",
  Test = "test",
  Provision = "provision",
}

export class TelegramCfg {
  @IsString()
  botToken!: string;

  chatIds!: Record<string, number>;

  giphyApiKey!: string;
}

export class RedisCfg {
  @IsString()
  host!: string;

  @IsNumber()
  port!: number;

  @IsBoolean()
  enabled!: boolean;

  @IsString()
  @IsOptional()
  password?: string;
}

export class JiraCfg {
  @IsEmail()
  email!: string;

  @IsString()
  accessToken!: string;

  @IsBoolean()
  enableSync!: boolean;
}

export class DbCfg {
  @IsString()
  host!: string;

  @IsNumber()
  port!: number;

  @IsString()
  username!: string;

  @IsString()
  password!: string;

  @IsString()
  schema!: string;

  @IsBoolean()
  synchronize!: boolean;

  @IsBoolean()
  isMigration!: boolean;
}

export class RmqCfg {
  @IsBoolean()
  enabled!: boolean;

  @IsString()
  url!: string;

  @IsString()
  host!: string;

  @IsString()
  port!: string;

  @IsString()
  login!: string;

  @IsString()
  password!: string;

  @IsString()
  exchangeName!: string;

  // @ValidateNested()
  // queues!: RmqQueues;
}

export class MinioCfg {
  @IsUrl()
  url!: string;

  @IsString()
  endPoint!: string;

  @IsString()
  accessKey!: string;

  @IsString()
  secretKey!: string;

  @IsBoolean()
  useSSL!: boolean;

  @IsOptional()
  @IsNumber()
  port?: number;

  @IsString()
  bucketName!: string;

  dirs!: Record<string, string>;
}

export class GRPCCfg {
  @IsString()
  host!: string;

  @IsNumber()
  port!: number;
}

export class KafkaCfg {
  @IsString()
  host!: string;

  @IsNumber()
  port!: number;

  @IsUrl({ require_tld: false, allow_underscores: true })
  schemaRegistryUrl!: string;
}

export class SentryCfg {
  @IsBoolean()
  enabled!: boolean;

  @IsUrl()
  dsn!: string;

  @IsEnum(Environment)
  environment!: Environment;
}
