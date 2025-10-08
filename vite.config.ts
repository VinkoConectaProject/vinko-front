import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  build: {
    // Gerar hashes únicos para assets em cada build
    // Isso evita cache de assets antigos
    rollupOptions: {
      output: {
        // Usar hash mais longo para evitar colisões
        entryFileNames: 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
      },
    },
    // Desabilitar minificação de nomes de classes para debug (opcional)
    // cssCodeSplit: true,
  },
  server: {
    // Desabilitar cache em desenvolvimento
    headers: {
      'Cache-Control': 'no-store',
    },
  },
  preview: {
    // Configurações para preview de produção
    headers: {
      'Cache-Control': 'no-store',
    },
  },
});
