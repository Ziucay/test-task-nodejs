FROM node:19.0.0-alpine

EXPOSE 3000

WORKDIR /app

COPY ./ ./

RUN npm install

CMD ["npm", "start"]