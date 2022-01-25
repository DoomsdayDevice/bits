export type GMethodInput = {
  name: string;
  service: string;
  requestType: () => string;
  responseType: () => string;
  propertyKey: string;
  descriptor: any;
};

export type GServiceInput = { name: string };

export type GMessageInput = { name: string };

export type GFieldInput = {
  name: string;
  messageName: string;
  typeFn: () => any;
  rule?: string;
  nullable: boolean;
};

export type GEnumInput = {
  enum: any;
  name: string;
};
