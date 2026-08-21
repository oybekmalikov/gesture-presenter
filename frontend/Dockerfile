# Multi-stage build for frontend
FROM node:22-alpine as build

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

# Production Nginx stage
FROM nginx:alpine

# Install openssl and generate self-signed SSL cert for standalone HTTPS
RUN apk add --no-cache openssl && \
    openssl req -x509 -nodes -days 3650 -newkey rsa:2048 \
    -keyout /etc/nginx/ssl.key -out /etc/nginx/ssl.crt \
    -subj "/C=UZ/ST=Tashkent/L=Almalyk/O=OKMK/CN=okmk-presenter"

COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80 443

CMD ["nginx", "-g", "daemon off;"]
