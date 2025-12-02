# 
# Stage 1 : Dépendances production
# 
FROM node:22-alpine AS deps

RUN apk update && apk upgrade --no-cache

# User non-root
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

WORKDIR /app

COPY package*.json ./

# Installation des pkg en production
RUN npm ci --only=production --ignore-scripts && \
    npm cache clean --force


# 
# Stage 2 : Dépendances build (dev)
# 
FROM node:22-alpine AS builder

RUN apk update && apk upgrade --no-cache

WORKDIR /app

COPY package*.json ./
# Installation des dépendances complètes pour un éventuel build
RUN npm ci --ignore-scripts

COPY . .

# 
# Stage 3 : Image production
# 
FROM node:22-alpine AS production

RUN apk update && apk upgrade --no-cache && \
    apk add --no-cache dumb-init

# User non-root
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

WORKDIR /app

# Copie des dépendances en production
COPY --from=deps --chown=nodejs:nodejs /app/node_modules ./node_modules

# Copie de l'application
COPY --from=builder --chown=nodejs:nodejs /app ./

# Création d'un dossier logs avec les bonnes permissions
RUN mkdir -p logs && chown -R nodejs:nodejs logs

USER nodejs

ENV NODE_ENV=production \
    PORT=8000

EXPOSE 8000

# Healthcheck
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
    CMD node -e "require('http').get('http://localhost:8000/', r => process.exit(r.statusCode === 200 ? 0 : 1))"

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "src/app.js"]
