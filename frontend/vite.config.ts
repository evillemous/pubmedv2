import path from "path"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    allowedHosts: [
      'medical-research-generator-tunnel-lvxwtt82.devinapps.com',
      'medical-research-app-tunnel-ftha50d1.devinapps.com',
      '*.devinapps.com'
    ],
  },
})

