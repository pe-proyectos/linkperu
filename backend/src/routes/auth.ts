import { Elysia, t } from "elysia";
import { prisma } from "../db";
import { hashPassword, verifyPassword, generateSlug, signToken } from "../auth";

export const authRoutes = new Elysia({ prefix: "/auth" })
  .post("/register", async ({ body, set }) => {
    const { email, password, name, slug: requestedSlug } = body;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      set.status = 409;
      return { error: "Email ya registrado" };
    }

    let slug = requestedSlug || generateSlug(name);
    const slugExists = await prisma.user.findUnique({ where: { slug } });
    if (slugExists && requestedSlug) {
      set.status = 409;
      return { error: "Ese enlace ya está en uso" };
    }
    let counter = 1;
    while (await prisma.user.findUnique({ where: { slug } })) {
      slug = `${generateSlug(name)}-${counter++}`;
    }

    const hashedPassword = await hashPassword(password);
    const user = await prisma.user.create({
      data: {
        email, password: hashedPassword, name, slug,
        page: { create: {} },
      },
      select: { id: true, email: true, name: true, slug: true, bio: true, avatar: true, theme: true },
    });

    return { user, token: signToken({ userId: user.id, email: user.email }) };
  }, {
    body: t.Object({
      email: t.String(),
      password: t.String({ minLength: 6 }),
      name: t.String(),
      slug: t.Optional(t.String()),
    }),
  })

  .post("/login", async ({ body, set }) => {
    const { email, password } = body;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !(await verifyPassword(password, user.password))) {
      set.status = 401;
      return { error: "Credenciales inválidas" };
    }

    const token = signToken({ userId: user.id, email: user.email });
    return {
      user: { id: user.id, email: user.email, name: user.name, slug: user.slug, bio: user.bio, avatar: user.avatar, theme: user.theme },
      token,
    };
  }, {
    body: t.Object({
      email: t.String(),
      password: t.String(),
    }),
  });
