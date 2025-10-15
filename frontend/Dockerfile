# frontend/Dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# Vite dev server default port
EXPOSE 5173

# listen on all interfaces inside Docker
CMD ["npm", "run", "dev", "--", "--host"]
