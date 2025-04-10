FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build TypeScript code
RUN npm run build

# Expose the application port
EXPOSE 3000

# Set environment variables with default values
ENV NODE_ENV=production \
    PORT=3000

# Start the application
CMD ["node", "dist/server.js"] 