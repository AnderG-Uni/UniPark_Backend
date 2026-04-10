# --- Stage 1: Base de construcción ---
FROM node:20-alpine AS builder

# Crear directorio de trabajo
WORKDIR /app

# Copiar archivos de dependencias
COPY package*.json ./

# Instalar TODAS las dependencias 
RUN npm ci --only=production

# Copiar el resto del código
COPY . .


# --- Stage 2: Runtime de Producción ---
FROM node:20-alpine AS runner

# Definir entorno de producción
ENV NODE_ENV=production

WORKDIR /app

# Instalar solo dependencias de producción y herramientas de seguridad
# 'dumb-init' ayuda a manejar correctamente los procesos (señales SIGTERM, etc.)
RUN apk add --no-cache dumb-init

# Copiar solo lo necesario desde el builder
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules

COPY src/ ./src/

# Crear un usuario específico para no ejecutar como root
USER nodeunipark

# Exponer el puerto de la app
EXPOSE 8080

# Usar dumb-init para evitar el problema del PID 1
ENTRYPOINT ["/usr/bin/dumb-init", "--"]

# Ejecutar la aplicación
CMD ["node", "server.js"]