FROM node:18

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm ci

COPY . .
RUN npm run build

EXPOSE 8080
CMD [ "npm", "run", "server" ]