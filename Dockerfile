# --- Etapa de Construcción (Vite Frontend) ---
FROM node:22-alpine AS build

WORKDIR /app

# Copiar dependencias
COPY package*.json ./
RUN npm install

# Copiar el resto del código
COPY . .

# Construir el frontend (genera los archivos en frontend/dist)
RUN npm run build

# --- Etapa de Producción ---
FROM node:22-alpine

WORKDIR /app

# Instalar solo las dependencias de producción
COPY package*.json ./
RUN npm install --omit=dev

# Copiar el backend
COPY backend ./backend

# Copiar los archivos estáticos del frontend desde la etapa de build
COPY --from=build /app/frontend/dist ./frontend/dist

# Exponer el puerto del servidor Express
EXPOSE 3000

# Comando para iniciar la aplicación (ejecuta backend/index.js)
CMD ["npm", "start"]
