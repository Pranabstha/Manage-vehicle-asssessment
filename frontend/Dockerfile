# Build context is the repo root, because the frontend type-checks ../shared too.
FROM node:24-alpine AS build
WORKDIR /app/frontend
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci
COPY shared /app/shared
COPY frontend ./
RUN npm run build

FROM nginx:1.27-alpine
# The nginx image fills ${BACKEND_PORT} in templates from the environment at startup.
COPY frontend/nginx.conf.template /etc/nginx/templates/default.conf.template
COPY --from=build /app/frontend/dist /usr/share/nginx/html
