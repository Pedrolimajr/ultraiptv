FROM node:18-alpine

WORKDIR /app

# Install dependencies (including dev dependencies for Prisma)
COPY package.json ./
# Try to copy package-lock.json if exists, otherwise npm install will work
COPY package-lock.json* ./
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
