FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install

FROM node:22-alpine AS build
WORKDIR /app
ARG NEXT_PUBLIC_API_URL
ARG API_INTERNAL_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV API_INTERNAL_URL=$API_INTERNAL_URL
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build
RUN mkdir -p .next/static/css/app && cp .next/static/css/*.css .next/static/css/app/layout.css

FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production
ENV HOSTNAME=0.0.0.0
COPY --from=build /app/.next/standalone ./
COPY --from=build /app/public ./app/public
COPY --from=build /app/.next/static ./app/.next/static
EXPOSE 3000
CMD ["node", "app/server.js"]
