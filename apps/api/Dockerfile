# LifeXP API — imagem de producao
FROM node:22-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json* ./
COPY packages ./packages
COPY apps/api ./apps/api
COPY tsconfig.json ./tsconfig.json
RUN npm install
RUN npm run generate:prisma
RUN npm run build --workspace=@lifexp/db
RUN npm run build --workspace=@lifexp/contracts
RUN npm run build --workspace=@lifexp/api

FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production
# Copila artefatos de build e dependencias de producao dos workspaces
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages/db/dist ./packages/db/dist
COPY --from=builder /app/packages/db/node_modules/.prisma ./packages/db/node_modules/.prisma
COPY --from=builder /app/packages/db/prisma ./packages/db/prisma
COPY --from=builder /app/packages/contracts/dist ./packages/contracts/dist
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/apps/api/package.json ./apps/api/package.json
EXPOSE 3333
CMD ["node", "apps/api/dist/index.js"]
