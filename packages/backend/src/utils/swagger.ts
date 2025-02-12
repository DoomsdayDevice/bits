import bodyParser from "body-parser";
import * as OpenApiValidator from "express-openapi-validator";
import * as fs from "fs";
import * as yaml from "js-yaml";
import { SwaggerModule } from "@nestjs/swagger";
import { INestApplication } from "@nestjs/common";

// TODO move to another 'http' package as it is not needed in a graphql/grpc setting
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
  app: INestApplication<any>,
  yamlPath: string,
  noAdditionalProperties: boolean
) => {
  app.use(bodyParser.json());
  const document = yaml.load(fs.readFileSync(yamlPath, "utf8")) as any;

  if (noAdditionalProperties) {
    setAdditionalPropertiesFalse(document);
  }
  const apiSpec = document;
  const validator = OpenApiValidator.middleware({
    apiSpec,
    ignorePaths: (path: string) => {
      return path.match(/^\/(swagger|custom-sw\.js)/);
    },
    validateRequests: {
      allowUnknownQueryParameters: false,
    },
    validateResponses: true, // false by default
  });

  app.use(validator);

  SwaggerModule.setup("swagger", app as any, document);
};
