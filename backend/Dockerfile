FROM node:18-alpine

WORKDIR /app

# Install OpenSSL and other dependencies required by Prisma
RUN apk add --no-cache openssl1.1-compat libc6-compat

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
