# Use official Node.js 18 Alpine image for multi-platform support
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package.json package-lock.json ./

# Install dependencies
RUN npm install --production

# Copy all source files
COPY . .

# Expose port 4000
EXPOSE 4000

# Set environment variable for port
ENV PORT=4000

# Start the server
CMD ["npm", "start"]
