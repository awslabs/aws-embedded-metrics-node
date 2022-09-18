FROM node:10.16.0-alpine AS base
RUN mkdir -p /app/src
WORKDIR /app/src

COPY package.json ./
RUN rm -rf node_modules/aws-embedded-metrics
COPY node_modules/aws-embedded-metrics ./node_modules/aws-embedded-metrics
COPY . .

CMD [ "node", "index" ]