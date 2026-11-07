FROM node:22-alpine
WORKDIR /app
COPY package*.json ./
COPY apps/web/package.json apps/web/package.json
COPY apps/api/package.json apps/api/package.json
RUN npm ci
COPY . .
RUN npm run build
ENV NODE_ENV=production PORT=8787
EXPOSE 8787
CMD ["npm","run","start","--workspace","@alsense/api"]
