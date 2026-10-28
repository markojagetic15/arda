# Build the SPA. VITE_* values are baked in at build time (passed as build args).
FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
ARG VITE_API_URL=/api
ARG VITE_WS_URL
ENV VITE_API_URL=$VITE_API_URL VITE_WS_URL=$VITE_WS_URL
# Self-host Excalidraw's fonts (the app sets EXCALIDRAW_ASSET_PATH=/ in production).
RUN cp -r node_modules/@excalidraw/excalidraw/dist/prod/fonts public/fonts
RUN npm run build

# Serve the static build
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
