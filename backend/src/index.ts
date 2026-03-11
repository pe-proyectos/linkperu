import { Elysia } from "elysia";
import { cors } from "@elysiajs/cors";
import { authRoutes } from "./routes/auth";
import { userRoutes } from "./routes/users";
import { linkRoutes } from "./routes/links";
import { pageRoutes } from "./routes/pages";

const app = new Elysia({ prefix: "/api" })
  .use(cors())
  .use(authRoutes)
  .use(userRoutes)
  .use(linkRoutes)
  .use(pageRoutes)
  .get("/health", () => ({ status: "ok" }))
  .listen(3000);

console.log(`🔗 LinkPeru API running on port ${app.server?.port}`);
