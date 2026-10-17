import { defineConfig } from 'vite';

import { resolve } from 'path';

export default defineConfig({
  root: 'frontend',
  build: {
    rollupOptions: {
      input: {
        login: resolve(__dirname, 'frontend/Login.html'),
        menu: resolve(__dirname, 'frontend/Menu.html'),
        empleados: resolve(__dirname, 'frontend/Empleados.html'),
        asistencias: resolve(__dirname, 'frontend/Asistencias.html'),
        recuperar: resolve(__dirname, 'frontend/RecuperarPassword.html'),
        registro: resolve(__dirname, 'frontend/RegistroCR.html')
      }
    }
  },
  server: {
    open: '/Login.html'
  }
});
