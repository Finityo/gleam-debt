import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

const isLive = process.env.BUILD_ENV === "live";

export default defineConfig(({ mode }) => {
  const isLiveMode = mode === 'live' || isLive;
  
  return {
    server: {
      host: "::",
      port: 8080,
    },
    plugins: [
      react(),
      mode === 'development' && componentTagger(),
    ].filter(Boolean),
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    root: isLiveMode ? undefined : undefined, // Both use same root
    build: {
      rollupOptions: {
        input: isLiveMode
          ? path.resolve(__dirname, "index-live.html")
          : path.resolve(__dirname, "index.html"),
      },
      outDir: isLive ? "dist-live" : "dist",
    },
  };
});
