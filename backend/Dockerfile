FROM node:18-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci

# Copy the rest of the application
COPY . .

# Build the NestJS application
RUN npm run build

# Expose the API port
EXPOSE 5050

# Start the application
CMD ["npm", "run", "start:prod"]
