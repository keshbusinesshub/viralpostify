# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma/

RUN npm install

# 🔥 IMPORTANT
RUN npx prisma generate

COPY . .

RUN npm run build

# Production stage
FROM node:20-alpine

WORKDIR /app

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma

# 🔥 IMPORTANT AGAIN
RUN npx prisma generate

EXPOSE 3000

CMD ["node", "dist/main.js"]
