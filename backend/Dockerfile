# Build stage
FROM node:20-alpine AS builder

RUN apk add --no-cache openssl python3 make g++

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma/

RUN npm install

RUN npx prisma generate

COPY . .

RUN npm run build

# Production stage
FROM node:20-alpine

RUN apk add --no-cache openssl python3 make g++

WORKDIR /app

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/package.json ./

RUN npx prisma generate

EXPOSE 3000

CMD ["sh", "-c", "npx prisma migrate deploy && echo '=== Starting Node ===' && node dist/main.js 2>&1; echo \"=== Node exited: $? ===\""]
