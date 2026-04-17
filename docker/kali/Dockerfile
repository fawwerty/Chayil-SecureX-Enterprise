FROM kalilinux/kali-rolling:latest

# Install only required tools
RUN apt-get update && apt-get install -y --no-install-recommends \
    nmap \
    nikto \
    theharvester \
    amass \
    whatweb \
    wafw00f \
    nuclei \
    sqlmap \
    net-tools \
    dnsutils \
    curl \
    wget \
    python3 \
    python3-pip \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# No shell access - tools only invoked via exec
USER nobody
WORKDIR /tmp
