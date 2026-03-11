import { Elysia } from "elysia";
import { prisma } from "../db";
import { getUser } from "../auth";

export const pageRoutes = new Elysia({ prefix: "/pages" })
  // Public: get page by slug
  .get("/:slug", async ({ params, set }) => {
    const user = await prisma.user.findUnique({
      where: { slug: params.slug },
      select: {
        name: true, slug: true, bio: true, avatar: true, theme: true,
        page: {
          include: {
            links: {
              where: { isActive: true },
              orderBy: { position: "asc" },
              select: { id: true, title: true, url: true, icon: true, position: true },
            },
          },
        },
      },
    });

    if (!user || !user.page) { set.status = 404; return { error: "Página no encontrada" }; }

    // Increment views
    await prisma.page.update({ where: { id: user.page.id }, data: { views: { increment: 1 } } });

    return {
      user: { name: user.name, slug: user.slug, bio: user.bio, avatar: user.avatar, theme: user.theme },
      links: user.page.links,
    };
  })

  // Click tracking
  .post("/click/:linkId", async ({ params, set }) => {
    try {
      await prisma.link.update({ where: { id: params.linkId }, data: { clicks: { increment: 1 } } });
      return { ok: true };
    } catch {
      set.status = 404;
      return { error: "Link not found" };
    }
  })

  // Stats (authenticated)
  .get("/stats/me", async ({ headers, set }) => {
    const auth = getUser(headers.authorization);
    if (!auth) { set.status = 401; return { error: "No autorizado" }; }

    const page = await prisma.page.findUnique({
      where: { userId: auth.userId },
      include: { links: { select: { id: true, title: true, clicks: true }, orderBy: { clicks: "desc" } } },
    });
    if (!page) { set.status = 404; return { error: "Página no encontrada" }; }

    const totalClicks = page.links.reduce((sum, l) => sum + l.clicks, 0);
    return { views: page.views, totalClicks, totalLinks: page.links.length, topLinks: page.links.slice(0, 5) };
  });
