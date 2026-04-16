# --- Stage 1: Constructor ---
FROM node:20-slim AS builder

# Instalar dependencias de compilación para Debian
# build-essential incluye gcc, g++, make y python3
RUN apt-get update && apt-get install -y \
    build-essential \
    libcairo2-dev \
    libpango1.0-dev \
    libjpeg-dev \
    libgif-dev \
    librsvg2-dev \
    python3 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copiar archivos de dependencias
COPY package*.json ./

# Instalar TODAS las dependencias
RUN npm ci --omit=dev

# --- Stage 2: Runtime de Producción ---
FROM node:20-slim AS runner

# Instalamos SOLO las librerías necesarias para ejecutar, no para compilar
# Incluimos dumb-init para seguridad de procesos
RUN apt-get update && apt-get install -y \
    libcairo2 \
    libpango-1.0-0 \
    libjpeg62-turbo \
    libgif7 \
    librsvg2-2 \
    dumb-init \
    && rm -rf /var/lib/apt/lists/*

ENV NODE_ENV=production
WORKDIR /app

# Copiar solo lo necesario desde el builder
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules

# Se crean las rutas y se dan permisos
RUN mkdir -p /app/logs /app/certs /app/src/assets/vehiculos && chown -R node:node /app

# Se copia los arcivos
COPY server.js ./
COPY src/ ./src/

# Asegura que incluso los archivos copiados pertenezcan a node
RUN chown -R node:node /app

# Crear un usuario específico para no ejecutar como root
USER node

# Exponer el puerto de la app
EXPOSE 8080

# Usar dumb-init para evitar el problema del PID 1
ENTRYPOINT ["/usr/bin/dumb-init", "--"]

# Ejecutar la aplicación
CMD ["node", "server.js"]