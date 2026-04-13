import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    // Run test files serially — each test resets the DB singleton,
    // parallel execution across files would race on that shared state.
    pool: 'forks',
    poolOptions: { forks: { singleFork: true } },
  },
});
