# Multi-stage build for frontend
FROM node:22-alpine as build

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

# Production Nginx stage
FROM nginx:alpine

# Copy pre-generated SSL certificates
COPY ssl/ssl.crt /etc/nginx/ssl.crt
COPY ssl/ssl.key /etc/nginx/ssl.key

COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80 443

CMD ["nginx", "-g", "daemon off;"]
