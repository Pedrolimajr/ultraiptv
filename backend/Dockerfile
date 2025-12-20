FROM node:18-bullseye-slim

WORKDIR /app

# Install OpenSSL (Debian bullseye already provides libssl1.1)
RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

# Install dependencies (including dev dependencies for Prisma)
COPY package.json ./
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
