import { INestApplication } from "@nestjs/common";
import bodyParser from "body-parser";
import * as OpenApiValidator from "express-openapi-validator";
import * as fs from "fs";
import * as yaml from "js-yaml";
import { SwaggerModule } from "@nestjs/swagger";

export * from "./fs";
export * from "./dto";
export * from "./crypt";
export * from "./reflectors";

export const getIpFromReq = (req: any) => {
  const { ip, headers } = req;
  const forwardIp = headers["x-forwarded-for"];
  const realIp = headers["x-real-ip"];

  let finalIp: string;

  if (ip.substr(0, 7) === "::ffff:") {
    finalIp = ip.substr(7);
    if (forwardIp || realIp) finalIp = forwardIp || realIp;
  } else finalIp = ip;

  return finalIp;
};

// TODO move to own file and possibly to another 'http' package as it is not needed in a graphql/grpc setting
function setAdditionalPropertiesFalse(openapiDocument: any): void {
  const addAdditionalProperties = (schema: any) => {
    if (schema && typeof schema === "object") {
      if (schema.type === "object" && !("additionalProperties" in schema)) {
        schema.additionalProperties = false;
      }
      for (const key in schema) {
        if (key === "properties") {
          for (const propKey in schema[key]) {
            addAdditionalProperties(schema[key][propKey]);
          }
        } else if (Array.isArray(schema[key])) {
          schema[key].forEach((item: any) => addAdditionalProperties(item));
        } else {
          addAdditionalProperties(schema[key]);
        }
      }
    }
  };

  for (const path in openapiDocument.paths) {
    for (const method in openapiDocument.paths[path]) {
      const operation = openapiDocument.paths[path][method];
      if (operation.requestBody && operation.requestBody.content) {
        for (const contentType in operation.requestBody.content) {
          addAdditionalProperties(
            operation.requestBody.content[contentType].schema
          );
        }
      }
      if (operation.responses) {
        for (const statusCode in operation.responses) {
          const response = operation.responses[statusCode];
          if (response.content) {
            for (const contentType in response.content) {
              addAdditionalProperties(response.content[contentType].schema);
            }
          }
        }
      }
    }
  }

  if (openapiDocument.components && openapiDocument.components.schemas) {
    for (const schemaName in openapiDocument.components.schemas) {
      addAdditionalProperties(openapiDocument.components.schemas[schemaName]);
    }
  }
  return openapiDocument;
}

export const loadSwagger = (
  app: INestApplication,
  yamlPath: string,
  noAdditionalProperties: boolean
) => {
  app.use(bodyParser.json());
  const document = yaml.load(fs.readFileSync(yamlPath, "utf8")) as any;

  console.dir(document, { depth: null });
  if (noAdditionalProperties) {
    setAdditionalPropertiesFalse(document);
  }
  console.dir(document, { depth: null });
  const apiSpec = document;
  const validator = OpenApiValidator.middleware({
    apiSpec,
    ignorePaths: (path: string) => {
      console.log("🚀 ~ ignorePaths ~ path:", path);
      return path.match(/^\/(swagger|custom-sw\.js)/);
    },
    validateRequests: {
      allowUnknownQueryParameters: false,
    },
    validateResponses: true, // false by default
  });

  app.use(validator);

  SwaggerModule.setup("swagger", app, document);
};
