import { Elysia, t } from "elysia";
import { prisma } from "../db";
import { getUser } from "../auth";

export const userRoutes = new Elysia({ prefix: "/users" })
  .get("/me", async ({ headers, set }) => {
    const auth = getUser(headers.authorization);
    if (!auth) { set.status = 401; return { error: "No autorizado" }; }

    const user = await prisma.user.findUnique({
      where: { id: auth.userId },
      select: { id: true, email: true, name: true, slug: true, bio: true, avatar: true, theme: true, createdAt: true },
    });
    if (!user) { set.status = 404; return { error: "Usuario no encontrado" }; }
    return { user };
  })

  .patch("/me", async ({ headers, body, set }) => {
    const auth = getUser(headers.authorization);
    if (!auth) { set.status = 401; return { error: "No autorizado" }; }

    const { name, bio, avatar, theme, slug } = body;
    const data: Record<string, string> = {};
    if (name !== undefined) data.name = name;
    if (bio !== undefined) data.bio = bio;
    if (avatar !== undefined) data.avatar = avatar;
    if (theme !== undefined) data.theme = theme;

    if (slug !== undefined) {
      const existing = await prisma.user.findUnique({ where: { slug } });
      if (existing && existing.id !== auth.userId) {
        set.status = 409;
        return { error: "Slug en uso" };
      }
      data.slug = slug;
    }

    const user = await prisma.user.update({
      where: { id: auth.userId },
      data,
      select: { id: true, email: true, name: true, slug: true, bio: true, avatar: true, theme: true },
    });
    return { user };
  }, {
    body: t.Object({
      name: t.Optional(t.String()),
      bio: t.Optional(t.String()),
      avatar: t.Optional(t.String()),
      theme: t.Optional(t.String()),
      slug: t.Optional(t.String()),
    }),
  });
