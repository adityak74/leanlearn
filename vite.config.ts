import { reactRouter } from "@react-router/dev/vite";
import { cloudflareDevProxy } from "@react-router/dev/vite/cloudflare";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";
import devServer from "@hono/vite-dev-server";

export default defineConfig({
  plugins: [
    cloudflareDevProxy(),
    devServer({
      entry: "app/server.ts",
      exclude: [/^\/(app|node_modules|src)\/.+/, /^\/@.+/, /^\/favicon\.ico/],
      injectClientScript: false,
    }),
    reactRouter(),
    tsconfigPaths(),
  ],
  ssr: {
    resolve: {
      externalConditions: ["workerd", "worker"],
    },
  },
});
