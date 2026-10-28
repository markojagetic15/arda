# Build: full deps (nest CLI, TypeScript) → dist/
FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Runtime: production deps + compiled output only
FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force
COPY --from=build /app/dist ./dist
EXPOSE 3000
# Pending migrations run on every start (no-op when up to date), then the API.
CMD ["sh", "-c", "npx typeorm migration:run -d dist/infrastructure/database/data-source.js && exec node dist/main"]
