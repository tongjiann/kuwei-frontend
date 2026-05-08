FROM node:22 AS build

# 固定 pnpm8
RUN corepack enable \
    && corepack prepare pnpm@8.15.9 --activate

WORKDIR /app

COPY package.json pnpm-lock.yaml ./

RUN pnpm install --frozen-lockfile

COPY . .

RUN pnpm build

FROM nginx:alpine

COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
