import { defineProject } from 'vitest/config';

export default defineProject({
  test: {
    name: '@base-ui/storybook-freeze',
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
});
