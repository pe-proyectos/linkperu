FROM oven/bun:1 AS base
WORKDIR /app

COPY package.json bun.lock ./
RUN bun install --production

COPY prisma ./prisma
RUN bunx prisma generate

COPY src ./src

EXPOSE 3000

CMD ["sh", "-c", "bunx prisma db push --skip-generate && bun src/index.ts"]
