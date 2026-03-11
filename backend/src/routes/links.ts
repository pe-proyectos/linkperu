import { Elysia, t } from "elysia";
import { prisma } from "../db";
import { getUser } from "../auth";

export const linkRoutes = new Elysia({ prefix: "/links" })
  .get("/", async ({ headers, set }) => {
    const auth = getUser(headers.authorization);
    if (!auth) { set.status = 401; return { error: "No autorizado" }; }

    const page = await prisma.page.findUnique({
      where: { userId: auth.userId },
      include: { links: { orderBy: { position: "asc" } } },
    });
    return { links: page?.links || [] };
  })

  .post("/", async ({ headers, body, set }) => {
    const auth = getUser(headers.authorization);
    if (!auth) { set.status = 401; return { error: "No autorizado" }; }

    const page = await prisma.page.findUnique({ where: { userId: auth.userId } });
    if (!page) { set.status = 404; return { error: "Página no encontrada" }; }

    const link = await prisma.link.create({
      data: { pageId: page.id, title: body.title, url: body.url, icon: body.icon, position: body.position ?? 0 },
    });
    return { link };
  }, {
    body: t.Object({
      title: t.String(),
      url: t.String(),
      icon: t.Optional(t.String()),
      position: t.Optional(t.Number()),
    }),
  })

  .put("/:id", async ({ headers, params, body, set }) => {
    const auth = getUser(headers.authorization);
    if (!auth) { set.status = 401; return { error: "No autorizado" }; }

    const link = await prisma.link.findUnique({ where: { id: params.id }, include: { page: true } });
    if (!link) { set.status = 404; return { error: "Enlace no encontrado" }; }
    if (link.page.userId !== auth.userId) { set.status = 403; return { error: "Prohibido" }; }

    const updated = await prisma.link.update({
      where: { id: params.id },
      data: {
        ...(body.title !== undefined && { title: body.title }),
        ...(body.url !== undefined && { url: body.url }),
        ...(body.icon !== undefined && { icon: body.icon }),
        ...(body.position !== undefined && { position: body.position }),
        ...(body.isActive !== undefined && { isActive: body.isActive }),
      },
    });
    return { link: updated };
  }, {
    body: t.Object({
      title: t.Optional(t.String()),
      url: t.Optional(t.String()),
      icon: t.Optional(t.String()),
      position: t.Optional(t.Number()),
      isActive: t.Optional(t.Boolean()),
    }),
  })

  .delete("/:id", async ({ headers, params, set }) => {
    const auth = getUser(headers.authorization);
    if (!auth) { set.status = 401; return { error: "No autorizado" }; }

    const link = await prisma.link.findUnique({ where: { id: params.id }, include: { page: true } });
    if (!link) { set.status = 404; return { error: "Enlace no encontrado" }; }
    if (link.page.userId !== auth.userId) { set.status = 403; return { error: "Prohibido" }; }

    await prisma.link.delete({ where: { id: params.id } });
    return { message: "Eliminado" };
  });
