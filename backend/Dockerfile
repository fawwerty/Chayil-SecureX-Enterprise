FROM kalilinux/kali-rolling

# Install NodeJS and Kali security tools directly from Kali repositories
RUN apt-get update && DEBIAN_FRONTEND=noninteractive apt-get install -y \
    nodejs \
    npm \
    nmap \
    nikto \
    sqlmap \
    theharvester \
    whatweb \
    amass \
    nuclei \
    curl \
    && rm -rf /var/lib/apt/lists/*

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
