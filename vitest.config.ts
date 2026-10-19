import { defineConfig } from "vitest/config";
import FnReporter from "./tests/fnReporter";

export default defineConfig({
  test: {
    environment: "node",
    reporters: ["default", new FnReporter()],
  },
});
