import { defineProject } from 'vitest/config';

export default defineProject({
  test: {
    name: '@storybook-tmp/baseui-mcp',
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
});
