FROM node:20-alpine AS builder

RUN apk add --no-cache openssl

WORKDIR /app
COPY package*.json ./
COPY prisma ./prisma/
RUN npm ci
RUN npx prisma generate
COPY . .
RUN npm run build

FROM node:20-alpine AS runner

RUN apk add --no-cache openssl

WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./
COPY --from=builder /app/prisma ./prisma

EXPOSE ${PORT:-4000}
CMD ["sh", "-c", "npx prisma migrate deploy; echo '=== Migration done, starting app ==='; echo \"PORT=$PORT REDIS_HOST=$REDIS_HOST REDIS_PORT=$REDIS_PORT\"; node dist/main 2>&1 || echo 'APP CRASHED WITH EXIT CODE '$?"]
