# Use Node.js image
FROM node:18-alpine

# Set working directory inside container
WORKDIR /app

# Copy package files from the *subfolder*, not root
COPY frontend/package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the frontend code into the container
COPY frontend/ .

# Expose ports used by Expo (web + mobile access)
EXPOSE 19000 19001 19002 19006

# Start the web server for port 19006
#CMD ["npx", "expo", "start", "--web", "--port", "19006"]
CMD ["npx", "expo", "start", "--web", "--host", "lan", "--port", "19006"]



