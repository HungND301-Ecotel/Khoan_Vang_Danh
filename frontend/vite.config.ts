import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  server: {
    port: 3000, // Giữ port 3000 cho quen thuộc
  },
  define: {
    // Fix lỗi "global is not defined" của sockjs-client
    global: "window",
  },
});
