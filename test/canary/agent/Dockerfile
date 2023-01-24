FROM node:16.17.0-alpine AS base
RUN mkdir -p /app/src
WORKDIR /app/src

COPY package.json ./
RUN rm -rf node_modules/aws-embedded-metrics
COPY node_modules/aws-embedded-metrics ./node_modules/aws-embedded-metrics
RUN npm install @datastructures-js/heap
COPY . .

CMD [ "node", "index" ]