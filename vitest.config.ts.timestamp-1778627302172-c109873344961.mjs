// vitest.config.ts
import { defineConfig } from "file:///E:/sis-dashboard/node_modules/vitest/dist/config.js";
import react from "file:///E:/sis-dashboard/node_modules/@vitejs/plugin-react/dist/index.js";
import path from "path";
var __vite_injected_original_dirname = "E:\\sis-dashboard";
var vitest_config_default = defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
    css: true,
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      exclude: [
        "node_modules/",
        "vitest.setup.ts",
        "**/*.config.{js,ts}",
        "**/types/**",
        "**/*.d.ts",
        "src/data/**",
        // Mock data
        "src/mocks/**",
        // Mock data
        ".next/**"
      ]
    }
  },
  resolve: {
    alias: {
      "@": path.resolve(__vite_injected_original_dirname, "./src")
    }
  }
});
export {
  vitest_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZXN0LmNvbmZpZy50cyJdLAogICJzb3VyY2VzQ29udGVudCI6IFsiY29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2Rpcm5hbWUgPSBcIkU6XFxcXHNpcy1kYXNoYm9hcmRcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIkU6XFxcXHNpcy1kYXNoYm9hcmRcXFxcdml0ZXN0LmNvbmZpZy50c1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vRTovc2lzLWRhc2hib2FyZC92aXRlc3QuY29uZmlnLnRzXCI7aW1wb3J0IHsgZGVmaW5lQ29uZmlnIH0gZnJvbSAndml0ZXN0L2NvbmZpZyc7XHJcbmltcG9ydCByZWFjdCBmcm9tICdAdml0ZWpzL3BsdWdpbi1yZWFjdCc7XHJcbmltcG9ydCBwYXRoIGZyb20gJ3BhdGgnO1xyXG5cclxuZXhwb3J0IGRlZmF1bHQgZGVmaW5lQ29uZmlnKHtcclxuICBwbHVnaW5zOiBbcmVhY3QoKV0sXHJcbiAgdGVzdDoge1xyXG4gICAgZW52aXJvbm1lbnQ6ICdqc2RvbScsXHJcbiAgICBnbG9iYWxzOiB0cnVlLFxyXG4gICAgc2V0dXBGaWxlczogWycuL3ZpdGVzdC5zZXR1cC50cyddLFxyXG4gICAgY3NzOiB0cnVlLFxyXG4gICAgY292ZXJhZ2U6IHtcclxuICAgICAgcHJvdmlkZXI6ICd2OCcsXHJcbiAgICAgIHJlcG9ydGVyOiBbJ3RleHQnLCAnanNvbicsICdodG1sJ10sXHJcbiAgICAgIGV4Y2x1ZGU6IFtcclxuICAgICAgICAnbm9kZV9tb2R1bGVzLycsXHJcbiAgICAgICAgJ3ZpdGVzdC5zZXR1cC50cycsXHJcbiAgICAgICAgJyoqLyouY29uZmlnLntqcyx0c30nLFxyXG4gICAgICAgICcqKi90eXBlcy8qKicsXHJcbiAgICAgICAgJyoqLyouZC50cycsXHJcbiAgICAgICAgJ3NyYy9kYXRhLyoqJywgLy8gTW9jayBkYXRhXHJcbiAgICAgICAgJ3NyYy9tb2Nrcy8qKicsIC8vIE1vY2sgZGF0YVxyXG4gICAgICAgICcubmV4dC8qKicsXHJcbiAgICAgIF0sXHJcbiAgICB9LFxyXG4gIH0sXHJcbiAgcmVzb2x2ZToge1xyXG4gICAgYWxpYXM6IHtcclxuICAgICAgJ0AnOiBwYXRoLnJlc29sdmUoX19kaXJuYW1lLCAnLi9zcmMnKSxcclxuICAgIH0sXHJcbiAgfSxcclxufSk7XHJcbiJdLAogICJtYXBwaW5ncyI6ICI7QUFBME8sU0FBUyxvQkFBb0I7QUFDdlEsT0FBTyxXQUFXO0FBQ2xCLE9BQU8sVUFBVTtBQUZqQixJQUFNLG1DQUFtQztBQUl6QyxJQUFPLHdCQUFRLGFBQWE7QUFBQSxFQUMxQixTQUFTLENBQUMsTUFBTSxDQUFDO0FBQUEsRUFDakIsTUFBTTtBQUFBLElBQ0osYUFBYTtBQUFBLElBQ2IsU0FBUztBQUFBLElBQ1QsWUFBWSxDQUFDLG1CQUFtQjtBQUFBLElBQ2hDLEtBQUs7QUFBQSxJQUNMLFVBQVU7QUFBQSxNQUNSLFVBQVU7QUFBQSxNQUNWLFVBQVUsQ0FBQyxRQUFRLFFBQVEsTUFBTTtBQUFBLE1BQ2pDLFNBQVM7QUFBQSxRQUNQO0FBQUEsUUFDQTtBQUFBLFFBQ0E7QUFBQSxRQUNBO0FBQUEsUUFDQTtBQUFBLFFBQ0E7QUFBQTtBQUFBLFFBQ0E7QUFBQTtBQUFBLFFBQ0E7QUFBQSxNQUNGO0FBQUEsSUFDRjtBQUFBLEVBQ0Y7QUFBQSxFQUNBLFNBQVM7QUFBQSxJQUNQLE9BQU87QUFBQSxNQUNMLEtBQUssS0FBSyxRQUFRLGtDQUFXLE9BQU87QUFBQSxJQUN0QztBQUFBLEVBQ0Y7QUFDRixDQUFDOyIsCiAgIm5hbWVzIjogW10KfQo=
