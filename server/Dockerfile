# 1. Use Node.js official image
FROM node:18

# 2. Set working directory inside container
WORKDIR /app

# 3. Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# 4. Copy all backend files
COPY . .

# 5. Expose backend port
EXPOSE 8000

# 6. Start the backend
CMD ["node", "app.js"]
