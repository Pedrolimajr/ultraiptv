FROM node:18-alpine

WORKDIR /app

# Install OpenSSL and other dependencies required by Prisma
# Alpine Linux já tem OpenSSL, mas precisamos garantir compatibilidade
RUN apk add --no-cache openssl libc6-compat || apk add --no-cache openssl

# Install dependencies (including dev dependencies for Prisma)
COPY package.json ./
# npm install works with or without package-lock.json
RUN npm install

# Copy Prisma schema first
COPY prisma ./prisma

# Generate Prisma client
RUN npx prisma generate

# Copy source code
COPY . .

# Remove dev dependencies to reduce image size
RUN npm prune --production

EXPOSE 3001

CMD ["npm", "run", "start:prod"]
