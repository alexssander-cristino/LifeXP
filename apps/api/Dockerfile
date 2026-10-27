# LifeXP API — imagem de produção
FROM node:22-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json ./
COPY packages ./packages
COPY apps/api ./apps/api
COPY tsconfig.json ./tsconfig.json
RUN npm ci
RUN npm run db:generate
RUN npm run build --workspace=@lifexp/contracts
RUN npm run build --workspace=@lifexp/api

FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages/db/package.json ./packages/db/package.json
COPY --from=builder /app/packages/db/prisma ./packages/db/prisma
COPY --from=builder /app/packages/contracts/package.json ./packages/contracts/package.json
COPY --from=builder /app/packages/contracts/dist ./packages/contracts/dist
COPY --from=builder /app/apps/api/package.json ./apps/api/package.json
COPY --from=builder /app/apps/api/dist ./apps/api/dist
EXPOSE 3333
CMD ["node", "apps/api/dist/index.js"]
