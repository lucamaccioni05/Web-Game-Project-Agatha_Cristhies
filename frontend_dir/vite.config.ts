import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,       // Esto permite conexiones externas (LAN/Internet)
    allowedHosts: true // <--- AGREGA ESTA LÍNEA MÁGICA
  },
});
