FROM node:20-slim AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npx prisma generate
RUN npm run build
RUN node_modules/.bin/tsc --skipLibCheck --esModuleInterop --resolveJsonModule \
    --module commonjs --target ES2020 --rootDir . --outDir /app/seed-dist prisma/seed.ts

FROM node:20-slim
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/seed-dist/prisma/seed.js ./prisma/seed.js
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY prisma/schema.prisma ./prisma/schema.prisma
COPY prisma/migrations ./prisma/migrations
RUN mkdir -p uploads
EXPOSE 4000
CMD ["sh", "-c", "npx prisma migrate deploy && node prisma/seed.js && node dist/server.js"]
