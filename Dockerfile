FROM node:10

WORKDIR /usr/src/app
COPY . .

RUN yarn && yarn global add typescript
RUN yarn build

EXPOSE 1337

CMD yarn start
