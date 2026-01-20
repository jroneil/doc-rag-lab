# ---------- deps ----------
FROM node:20-alpine AS deps
WORKDIR /app

    # If you use npm:
    COPY package.json package-lock.json* ./
    RUN npm install

# ---------- build ----------
FROM node:20-alpine AS builder
ARG NEXT_PUBLIC_API_PY_BASE_URL
ARG NEXT_PUBLIC_API_JAVA_BASE_URL

ENV API_PY_BASE_URL=$API_PY_BASE_URL
ENV JAVA_BASE_URL=$API_JAVA_BASE_URL
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# ---------- runner ----------
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# Next.js runtime needs these
COPY --from=builder /app/package.json ./
COPY --from=builder /app/next.config.* ./
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules

EXPOSE 3000
CMD ["npm", "run", "start"]
