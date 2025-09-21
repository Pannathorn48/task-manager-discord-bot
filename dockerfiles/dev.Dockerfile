# Use specific version for security and reproducibility
FROM node:24-alpine

# Install pnpm globally
RUN npm install -g pnpm

# Set working directory
WORKDIR /app

# Copy package files first for better Docker layer caching
COPY package.json pnpm-lock.yaml ./

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy application code
COPY tsconfig.json ./
COPY src/ ./src/

# Expose port
EXPOSE 3000

# Use tsx for better TypeScript support
CMD ["pnpm", "run", "dev"]