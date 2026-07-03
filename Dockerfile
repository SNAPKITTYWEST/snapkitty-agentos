FROM alpine:latest

WORKDIR /app

COPY . /app

RUN apk add --no-cache bash git nodejs npm make g++ cmake

COPY package.json package-lock.json ./
RUN npm ci

RUN mkdir -p .agentos/runtime
RUN mkdir -p build

EXPOSE 3000

CMD ["node", "-e", "console.log('Starting SnapKitty Agent OS...'); process.exit(0)"]
