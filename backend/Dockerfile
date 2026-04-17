FROM node:20-bookworm-slim

# Install security tools
RUN apt-get update && apt-get install -y \
    nmap \
    nikto \
    sqlmap \
    theharvester \
    whatweb \
    wget \
    git \
    python3 \
    python3-pip \
    && rm -rf /var/lib/apt/lists/*

# Install Amass and Nuclei binaries
RUN wget https://github.com/OWASP/Amass/releases/download/v4.2.0/amass_linux_amd64.zip \
    && apt-get update && apt-get install -y unzip \
    && unzip amass_linux_amd64.zip \
    && mv amass_linux_amd64/amass /usr/local/bin/ \
    && rm -rf amass_linux_amd64*

RUN wget https://github.com/projectdiscovery/nuclei/releases/download/v3.2.9/nuclei_3.2.9_linux_amd64.zip \
    && unzip nuclei_3.2.9_linux_amd64.zip \
    && mv nuclei /usr/local/bin/ \
    && rm -rf nuclei*

WORKDIR /app

COPY package.json ./
RUN npm install --omit=dev

COPY src/ ./src/

RUN mkdir -p logs

ENV NODE_ENV=production
ENV USE_DOCKER=false

EXPOSE 4000

HEALTHCHECK --interval=15s --timeout=10s --start-period=60s --retries=5 \
  CMD wget -qO- http://localhost:4000/health || exit 1

CMD ["node", "src/server.js"]
