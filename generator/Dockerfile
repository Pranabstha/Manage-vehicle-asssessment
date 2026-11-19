# The ../shared imports are type-only and stripped at runtime, so this folder is the whole build context.
FROM node:24-alpine
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev
COPY *.ts ./
USER node
CMD ["node", "index.ts"]
