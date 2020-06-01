import { graphql, RouterContext, RouterMiddleware, Status } from "./deps.ts";

type GraphQLOptions = {
  schema?: any;
  rootValue?: object;
  context?: (ctx: RouterContext) => void;
  fieldResolver?: any;
  typeResolver?: any;
};

type GraphQLParams = {
  query: string;
  mutation: string;
  variables?: object;
  operationName?: string;
};

export function graphqlHTTP(options: GraphQLOptions): RouterMiddleware {
  if (!options) throw new Error("GraphQL Server requires options.");

  return async (ctx: RouterContext) => {
    try {
      // Assert that schema is required.
      if (!options.schema) {
        ctx.throw(
          Status.BadRequest,
          "GraphQL middleware options must contain a schema."
        );
      }

      const params: GraphQLParams = (await ctx.request.body()).value;
      const contextValue = options.context ? options.context(ctx) : undefined;
      const source = params.query || params.mutation;

      if (!source)
        ctx.throw(Status.BadRequest, "GraphQL query or mutation is missing!");

      if (!params) ctx.throw(Status.BadRequest, "Bad Request");

      const result = (await graphql(
        options.schema,
        source,
        options.rootValue,
        contextValue,
        params.variables,
        params.operationName,
        options.fieldResolver,
        options.typeResolver
      )) as any;

      if (ctx.response.status === 200 && !result.data) {
        ctx.response.status = 500;
      }

      if (result.errors) {
        const { errors } = result;
        console.log("errors", errors);
        errors.map((err: any) => {
          ctx.response.status = 400;
          ctx.response.body = { error: err };
        });
        return;
      }

      ctx.response.status = 200;
      ctx.response.body = result;
    } catch (error) {
      ctx.response.status = error.status;
      ctx.response.body = { error: error };
      return;
    }
  };
}
