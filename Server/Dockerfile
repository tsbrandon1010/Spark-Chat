FROM node:21-alpine3.17

WORKDIR /app/
COPY index.js package.json package-lock.json /app/
RUN npm install
EXPOSE 80
EXPOSE 3000
CMD ["node", "index.js"]