FROM node:18-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

RUN npm run build

EXPOSE 8000

# Use npm start instead of direct node command for better error reporting
CMD ["npm", "start"]
