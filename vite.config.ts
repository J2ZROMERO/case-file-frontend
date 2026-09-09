import { defineConfig } from "vite";

export default defineConfig({
  resolve: {
    dedupe: ["react", "react-dom", "@fullcalendar/core"],
  },
  optimizeDeps: {
    include: [
      "@fullcalendar/core",
      "@fullcalendar/react",
      "@fullcalendar/daygrid",
      "@fullcalendar/timegrid",
      "@fullcalendar/interaction",
    ],
  },
  server: {
    host: "127.0.0.1",
    port: 5173,
  },
});
