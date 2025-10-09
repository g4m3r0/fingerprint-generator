# syntax=docker/dockerfile:1

FROM node:20-alpine AS deps
WORKDIR /app

# Install only production dependencies
COPY package.json ./
RUN npm install --omit=dev

FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

COPY --from=deps /app/node_modules ./node_modules
COPY . .

EXPOSE 3000
CMD ["node", "index.js"]
