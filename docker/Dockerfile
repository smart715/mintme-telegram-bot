FROM node:16-alpine3.16

WORKDIR /src

COPY package.json package-lock.json /src/

# Allows slow connections to build sucessfully
RUN npm config set maxsockets=3

RUN npm ci --production=false

COPY . /src

RUN cp docker/docker-entrypoint.sh /usr/local/bin/docker-entrypoint && \
    chmod +x /usr/local/bin/docker-entrypoint

ENTRYPOINT ["docker-entrypoint"]

EXPOSE 4550
