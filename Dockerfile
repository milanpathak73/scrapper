# Use the official Node.js image with the specific version
FROM node:20.15.1

# Create and set the working directory
WORKDIR /usr/src/app

# Copy package.json and package-lock.json (if available) into the container
COPY package*.json ./

# Install dependencies
RUN npm install

RUN npx puppeteer browsers install chrome

# Copy the rest of the application code into the container
COPY . .

# Expose port 8080
EXPOSE 8080

# Command to run the application
CMD ["node", "index.js"] 
