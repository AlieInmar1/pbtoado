# Use a standard Debian-based Node.js 20 image
FROM node:20-slim

# Set Apify environment variable (often needed for non-Apify base images)
ENV APIFY_IS_AT_HOME=1

# Install OS dependencies using apt-get
# Includes common Playwright dependencies for Debian/Ubuntu
RUN apt-get update && apt-get install -y --no-install-recommends \
    chromium \
    libnss3 \
    libatk1.0-0 \
    libatk-bridge2.0-0 \
    libcups2 \
    libdbus-1-3 \
    libdrm2 \
    libgbm1 \
    libgtk-3-0 \
    libxcomposite1 \
    libxdamage1 \
    libxfixes3 \
    libxrandr2 \
    libxshmfence1 \
    libxtst6 \
    libasound2 \
    fonts-liberation \
    wget \
    ca-certificates \
    # Clean up apt cache
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /home/apify/actor

# Copy ALL actor source code first
COPY . ./

# Find out what the existing user/group is for the directory
# and ensure correct permissions
RUN mkdir -p /home/apify/actor && \
    chown -R 1000:1000 /home/apify/actor

# Install Node.js dependencies 
RUN npm install --omit=dev --no-optional

# Install Playwright browser (without --with-deps)
# Use --force because apt-get already installed chromium system-wide
RUN npx playwright install --force chromium

# Set the default command to run the actor
CMD [ "node", "main.js" ]
