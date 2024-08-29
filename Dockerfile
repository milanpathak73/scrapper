# Use the official Node.js image with the specific version
FROM node:20.15.1

# Create and set the working directory
WORKDIR /usr/src/app

# Copy package.json and package-lock.json (if available) into the container
COPY package*.json ./

# Install dependencies
RUN npm install


RUN RUN apt-get update && \
apt-get install -y \
wget \
gnupg \
libx11-xcb1 \
libxcomposite1 \
libxdamage1 \
libxrandr2 \
libxtst6 \
libnss3 \
libatk-bridge2.0-0 \
libatk1.0-0 \
libcups2 \
libxshmfence1 \
libgbm1 \
libnspr4 \
libu2f-udev \
libappindicator3-1 \
libxss1 \
libasound2 \
libpango-1.0-0 \
libpangocairo-1.0-0 \
libcairo2 \
fonts-liberation \
libu2f-udev \
lsb-release \
xdg-utils \
--no-install-recommends && \
rm -rf /var/lib/apt/lists/*


# Copy the rest of the application code into the container
COPY . .

# Install Puppeteer and download its version of Chrome
RUN npm install puppeteer@latest

# Expose port 8080
EXPOSE 8080

# Command to run the application
CMD ["npm", "start"]
