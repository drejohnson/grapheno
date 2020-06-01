import { Application, Router } from "https://deno.land/x/oak/mod.ts";
import { graphqlHTTP, buildSchema } from "./mod.ts";

const port = 4000;

const schema = buildSchema(
  `
  type Query {
    hello: String
  }
`,
  undefined
);

const root = { hello: () => "Hello world!" };

const app = new Application();
const router = new Router();

router.post(
  "/graphql",
  graphqlHTTP({
    schema,
    rootValue: root,
  })
);

app.use(router.routes(), router.allowedMethods());

console.log(`Server listening on port ${port}`);
await app.listen({ port });
