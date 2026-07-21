FROM node:22-alpine AS build
WORKDIR /app
ARG REGOS_API_ORIGIN=http://api:8000
ENV REGOS_API_ORIGIN=${REGOS_API_ORIGIN}
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app ./
EXPOSE 3000
CMD ["npm", "run", "start"]
