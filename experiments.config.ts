/**
 * Experiments for the storybook-freeze CLI (`pnpm experiment:freeze`).
 *
 * Each entry regenerates one git branch containing only the listed facets; everything else is
 * stripped from the Storybook corpus. Facets are qualified `category.leaf` labels from
 * `apps/storybook/classification-labels.jsonc` (excluding the always-stripped delete facets).
 * Every `branchName` must start with `experiment/`.
 *
 * `story.base` marks the 1:1 base-ui.com doc stories; include it in every experiment to keep
 * that baseline across all branches.
 */
interface Experiment {
  branchName: string;
  facets: string[];
}

const experiments: Experiment[] = [
  {
    branchName: 'experiment/showcase-only',
    facets: ['story.base', 'story.showcase', 'mdx.general', 'source-jsdoc.component'],
  },
  {
    branchName: 'experiment/api-reference',
    facets: ['story.base', 'story.api-ref', 'source-jsdoc.props', 'mdx.props'],
  },
  {
    branchName: 'experiment/keep-all',
    facets: [
      'source-jsdoc.component',
      'source-jsdoc.props',
      'csf-jsdoc.meta',
      'csf-jsdoc.story',
      'mdx.general',
      'mdx.behavior',
      'mdx.examples',
      'mdx.do-dont',
      'mdx.when-to-use',
      'mdx.anatomy',
      'mdx.history',
      'mdx.known-issues',
      'mdx.a11y',
      'mdx.brand',
      'mdx.props',
      'general.general-a11y',
      'general.general-tokens',
      'general.general-setup',
      'general.general-brand',
      'general.general-do-dont',
      'general.general-when-to-use',
      'story.base',
      'story.api-ref',
      'story.showcase',
      'story.highlight',
      'story.examples',
      'story.playground',
      'story.tests',
      'story.animation',
    ],
  },
  {
    branchName: 'experiment/purge-component-jsdoc',
    facets: [
      'source-jsdoc.props',
      'csf-jsdoc.meta',
      'csf-jsdoc.story',
      'mdx.general',
      'mdx.behavior',
      'mdx.examples',
      'mdx.do-dont',
      'mdx.when-to-use',
      'mdx.anatomy',
      'mdx.history',
      'mdx.known-issues',
      'mdx.a11y',
      'mdx.brand',
      'mdx.props',
      'general.general-a11y',
      'general.general-tokens',
      'general.general-setup',
      'general.general-brand',
      'general.general-do-dont',
      'general.general-when-to-use',
      'story.base',
      'story.api-ref',
      'story.showcase',
      'story.highlight',
      'story.examples',
      'story.playground',
      'story.tests',
      'story.animation',
    ],
  },
  {
    branchName: 'experiment/purge-props-jsdoc',
    facets: [
      'source-jsdoc.component',
      'csf-jsdoc.meta',
      'csf-jsdoc.story',
      'mdx.general',
      'mdx.behavior',
      'mdx.examples',
      'mdx.do-dont',
      'mdx.when-to-use',
      'mdx.anatomy',
      'mdx.history',
      'mdx.known-issues',
      'mdx.a11y',
      'mdx.brand',
      'mdx.props',
      'general.general-a11y',
      'general.general-tokens',
      'general.general-setup',
      'general.general-brand',
      'general.general-do-dont',
      'general.general-when-to-use',
      'story.base',
      'story.api-ref',
      'story.showcase',
      'story.highlight',
      'story.examples',
      'story.playground',
      'story.tests',
      'story.animation',
    ],
  },
];

export default experiments;
