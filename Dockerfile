FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine AS runtime
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev --legacy-peer-deps
COPY --from=build /app/dist ./dist
COPY --from=build /app/public ./public
COPY server ./server

EXPOSE 5000
ENV NODE_ENV=production
ENV PORT=5000

CMD ["node", "server/index.js"]