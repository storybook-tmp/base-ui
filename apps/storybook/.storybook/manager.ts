import { addons } from 'storybook/manager-api';
import { defaultConfig, type TagBadgeParameters } from 'storybook-addon-tag-badges/manager-helpers';

addons.setConfig({
  tagBadges: [
    {
      tags: 'base',
      badge: {
        text: 'BaseUI',
        style: {
          backgroundColor: '#000',
          color: '#fff',
        },
      },
      display: {
        sidebar: true,
        toolbar: true,
        mdx: true,
      },
    },
    {
      tags: 'api-ref',
      badge: {
        text: 'API',
        style: 'grey',
      },
      display: {
        sidebar: true,
        toolbar: true,
        mdx: true,
      },
    },
    {
      tags: 'highlight',
      badge: {
        text: 'Highlight',
        style: 'blue',
      },
      display: {
        sidebar: true,
        toolbar: true,
        mdx: true,
      },
    },
    {
      tags: 'examples',
      badge: {
        text: 'Example 👀',
        style: 'green',
      },
      display: {
        sidebar: true,
        toolbar: true,
        mdx: true,
      },
    },
    {
      tags: 'playground',
      badge: {
        text: 'Playground 🛝',
        style: 'turquoise',
      },
      display: {
        sidebar: true,
        toolbar: true,
        mdx: true,
      },
    },
    {
      tags: 'tests',
      badge: {
        text: 'Test 🧪',
        style: 'orange',
      },
      display: {
        sidebar: true,
        toolbar: true,
        mdx: true,
      },
    },
    {
      tags: 'animation',
      badge: {
        text: 'Animation 🎬',
        style: 'purple',
      },
      display: {
        sidebar: true,
        toolbar: true,
        mdx: true,
      },
    },
    {
      tags: 'showcase',
      badge: {
        text: 'Showcase',
        style: {
          backgroundColor: '#fc9ec5',
          borderColor: '#fe7bb2',
          color: '#161314',
        },
      },
      display: {
        sidebar: true,
        toolbar: true,
        mdx: true,
      },
    },
    ...defaultConfig,
  ] satisfies TagBadgeParameters,
});
