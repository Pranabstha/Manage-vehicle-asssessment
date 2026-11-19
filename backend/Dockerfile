# Build context is the repo root, because the backend compiles ../shared too.
FROM node:24-alpine AS build
WORKDIR /app/backend
COPY backend/package.json backend/package-lock.json ./
RUN npm ci
COPY shared /app/shared
COPY backend ./
RUN npm run build

FROM node:24-alpine
ENV NODE_ENV=production
WORKDIR /app/backend
COPY backend/package.json backend/package-lock.json ./
RUN npm ci --omit=dev
COPY --from=build /app/backend/dist ./dist
# Node 24 loads these .ts migrations directly, so they are not compiled.
COPY backend/migrations ./dist/backend/migrations
USER node
EXPOSE 8000
CMD ["node", "dist/backend/src/index.js"]
