FROM node:10.16.0-alpine AS base
RUN mkdir -p /app/src
WORKDIR /app/src

COPY package.json ./
# install packages but copy the local version of the package in directly
RUN npm i && rm -rf node_modules/aws-embedded-metrics
COPY node_modules/aws-embedded-metrics ./node_modules/aws-embedded-metrics

# copy the source files over
COPY . .

CMD [ "node", "app" ]
