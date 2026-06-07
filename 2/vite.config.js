import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
// 引入插件
import AutoImport from 'unplugin-auto-import/vite';
import Components from 'unplugin-vue-components/vite';
import { VantResolver } from '@vant/auto-import-resolver';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    AutoImport({
      resolvers: [VantResolver()],
    }),
    Components({
      resolvers: [VantResolver()],
    })
  ],
  server: {
    host: "0.0.0.0",
    port: 5174,
    proxy: {
      "/v3pz": {
        target: "https://v3pz.itndedu.com",
        changeOrigin: true,
        secure: true,
      },
    },
  },
})
