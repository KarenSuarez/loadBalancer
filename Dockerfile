FROM node:21

RUN npm install -g pm2

WORKDIR /app

COPY . .

RUN npm install

EXPOSE 12555

CMD ["pm2-runtime", "app.js"]
