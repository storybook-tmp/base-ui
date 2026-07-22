import { addons } from 'storybook/manager-api';
import { defaultConfig, type TagBadgeParameters } from 'storybook-addon-tag-badges/manager-helpers';

addons.setConfig({
  tagBadges: [
    {
      tags: 'verified',
      badge: {
        text: 'Check 🐸',
        style: {
          backgroundColor: '#001c13',
          color: '#e0eb0b',
        },
      },
      display: {
        sidebar: [
          {
            type: 'component',
            skipInherited: true,
          },
          {
            type: 'docs',
            skipInherited: true,
          },
          {
            type: 'story',
            skipInherited: true,
          },
        ],
        toolbar: false,
        mdx: true,
      },
    },
    ...defaultConfig,
  ] satisfies TagBadgeParameters,
});
