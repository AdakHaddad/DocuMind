# Build stage
FROM oven/bun:1 as builder

WORKDIR /app

# Install Python and required packages
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    python3-venv \
    && rm -rf /var/lib/apt/lists/*

# Create and activate virtual environment
RUN python3 -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

# Copy package files
COPY package.json ./
COPY bun.lock ./

# Install dependencies
RUN bun install --frozen-lockfile

# Copy Python requirements and install in virtual environment
COPY requirements.txt ./
RUN . /opt/venv/bin/activate && pip3 install --no-cache-dir -r requirements.txt

# Copy source code
COPY . .

# Create necessary directories
RUN mkdir -p uploads processed

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3001
ENV PYTHONPATH=/opt/venv/bin/python3

# Expose port
EXPOSE 3001

# Start the application
CMD ["bun", "run", "start"]