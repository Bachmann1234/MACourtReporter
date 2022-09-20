FROM node:18

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm ci --only=production
RUN npm run build

COPY . .

EXPOSE 8080
CMD [ "npm", "run", "server" ]