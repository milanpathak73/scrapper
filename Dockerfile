# Use the official Node.js image with the specific version
FROM node:20.15.1

# Create and set the working directory
WORKDIR /usr/src/app

# Copy package.json and package-lock.json (if available) into the container
COPY package*.json ./

# Install dependencies
RUN npm install

# Install Puppeteer dependencies
RUN apt-get update && apt-get install -y \
  wget \
  ca-certificates \
  fonts-liberation \
  libappindicator3-1 \
  libasound2 \
  libatk-bridge2.0-0 \
  libatk1.0-0 \
  libcups2 \
  libx11-xcb1 \
  libxcomposite1 \
  libxdamage1 \
  libxrandr2 \
  libxshm0 \
  libxss1 \
  libxtst6 \
  lsb-release \
  xdg-utils \
  && rm -rf /var/lib/apt/lists/*

# Copy the rest of the application code into the container
COPY . .

# Expose port 8080
EXPOSE 8080

# Command to run the application
CMD ["node", "index.js"]
