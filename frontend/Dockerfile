# Use Node.js image
FROM node:18

# Set working directory inside container
WORKDIR /app

# Copy package files from the *subfolder*, not root
COPY frontend/package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the frontend code into the container
COPY frontend/ .

# Expose the default port (adjust if needed)
EXPOSE 19006

# Start the server
CMD ["npm", "start"]
