import { defineConfig } from "@solidjs/start/config";

export default defineConfig({
  ssr: true,
  vite: {
    ssr: {
      external: ["@prisma/client"],
    },
  },
});
