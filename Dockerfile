# build the js app
FROM node:10.0.0 as build-deps
WORKDIR /app/
COPY ./package.json /app/
RUN npm install
COPY . /app
RUN npm install

# use the ngnix server to serve the built stuff
FROM nginx:1.13.12

COPY nginx.conf /etc/nginx/nginx.conf

COPY --from=build-deps /app /app

RUN echo '{ \
  "httpPort": 80, \
  "configPath": "/etc/nginx/nginx.conf", \
  "configType": "text", \
  "dataPath":   "/app" \
}' > /etc/ezmaster.json
