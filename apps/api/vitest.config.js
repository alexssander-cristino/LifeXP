import { defineConfig } from "vitest/config";
export default defineConfig({
    test: {
        include: ["apps/api/test/**/*.test.ts"],
        environment: "node",
        setupFiles: ["apps/api/test/setup.ts"],
        pool: "forks",
        poolOptions: {
            forks: { singleFork: true },
        },
    },
});
