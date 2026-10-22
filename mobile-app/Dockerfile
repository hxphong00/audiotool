FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm install --no-audit --no-fund

COPY . .
RUN npx expo export --platform web --output-dir dist

FROM python:3.11-slim

WORKDIR /srv
COPY --from=builder /app/dist /srv

EXPOSE 3000

CMD ["python3", "-m", "http.server", "3000", "--bind", "0.0.0.0", "--directory", "/srv"]
