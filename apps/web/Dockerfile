# LifeXP Web — build e servidor de preview para desenvolvimento/produção simples
FROM node:22-alpine
WORKDIR /app
COPY package.json package-lock.json ./
COPY packages ./packages
COPY apps/web ./apps/web
RUN npm ci
RUN npm run build --workspace=@lifexp/web
ENV NODE_ENV=production
EXPOSE 5173
CMD ["npm", "run", "preview", "--workspace=@lifexp/web", "--", "--host", "0.0.0.0", "--port", "5173"]
