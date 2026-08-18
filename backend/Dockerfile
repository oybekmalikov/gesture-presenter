# Backend Dockerfile (Node.js + LibreOffice for PPTX conversion)
FROM node:22-bullseye-slim

# Install LibreOffice headless, fonts, and required tools
RUN apt-get update && apt-get install -y --no-install-recommends \
    libreoffice \
    libreoffice-impress \
    fonts-dejavu \
    fonts-liberation \
    curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy package files and install production dependencies
COPY package*.json ./
RUN npm install

# Copy source code and build TypeScript
COPY . .
RUN npm run build

# Ensure storage directories exist
RUN mkdir -p public/pdf public/glb public/temp

EXPOSE 5050

ENV PORT=5050
ENV NODE_ENV=production

CMD ["npm", "run", "start"]
