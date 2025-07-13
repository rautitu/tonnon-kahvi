# Use Node.js image
FROM node:18

# Set working directory inside container
WORKDIR /app

#RUN apt-get update && apt-get install -y watchman

# Copy package files from the *subfolder*, not root
COPY frontend/package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the frontend code into the container
COPY frontend/ .

# Expose ports used by Expo (web + mobile access)
EXPOSE 19000 19001 19002 19006

# Start the server
#CMD ["npm", "start"]
#CMD ["npx", "expo", "start", "--clear"]
CMD ["npx", "expo", "start", "--web", "--host", "0.0.0.0"]

