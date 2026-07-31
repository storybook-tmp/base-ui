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
 *
 * After regenerating, `pnpm storybook:publish-branches` force-pushes the branches to origin;
 * each push triggers the storybook-mcp-preview workflow, which publishes the branch's
 * @storybook-tmp/baseui-mcp package (MCP server + baked manifests) to pkg.pr.new.
 */
interface Experiment {
  branchName: string;
  facets: string[];
}

const BASE_FACETS = [
  'source-jsdoc.component',
  'source-jsdoc.props',
  'csf-jsdoc.meta',
  'csf-jsdoc.story',
  'mdx.anatomy',
  'general.general-setup',
  'general.general-brand',
  'story.base',
];

const experiments: Experiment[] = [
  {
    branchName: 'experiment/empty',
    facets: [],
  },
  {
    branchName: 'experiment/base',
    facets: BASE_FACETS,
  },
  {
    branchName: 'experiment/full',
    facets: [
      ...BASE_FACETS,
      'mdx.general',
      'mdx.behavior',
      'mdx.examples',
      'mdx.do-dont',
      'mdx.when-to-use',
      'mdx.history',
      'mdx.known-issues',
      'mdx.a11y',
      'mdx.brand',
      'mdx.props',
      'general.general-a11y',
      'general.general-tokens',
      'general.general-do-dont',
      'general.general-when-to-use',
      'story.api-ref',
      'story.showcase',
      'story.highlight',
      'story.examples',
      'story.animation',
      'story.tests',
    ],
  },
  {
    branchName: 'experiment/basic-docs',
    facets: [...BASE_FACETS, 'mdx.general', 'mdx.behavior', 'story.showcase', 'story.highlight'],
  },
  // FIXME: disabled until we check that we've updated live examples with Mealdrop content
  // both on the Base UI and Droppy Storybooks.
  // {
  //   branchName: 'experiment/product-examples',
  //   facets: [...BASE_FACETS, 'mdx.examples', 'story.examples'],
  // },
  {
    branchName: 'experiment/do-dont',
    facets: [...BASE_FACETS, 'mdx.do-dont', 'general.general-do-dont'],
  },
  {
    branchName: 'experiment/when-to-use',
    facets: [...BASE_FACETS, 'mdx.when-to-use', 'general.general-when-to-use'],
  },
  {
    branchName: 'experiment/history-issues',
    facets: [...BASE_FACETS, 'mdx.history', 'mdx.known-issues'],
  },
  {
    branchName: 'experiment/a11y',
    facets: [...BASE_FACETS, 'mdx.a11y', 'general.general-a11y'],
  },
  {
    branchName: 'experiment/brand-animation',
    facets: [...BASE_FACETS, 'mdx.brand', 'story.animation'],
  },
  {
    branchName: 'experiment/api-ref',
    facets: [...BASE_FACETS, 'mdx.props', 'story.api-ref', 'story.highlight'],
  },
  {
    branchName: 'experiment/docs-full',
    facets: [
      ...BASE_FACETS,
      'mdx.general',
      'mdx.behavior',
      'mdx.do-dont',
      'mdx.when-to-use',
      'mdx.history',
      'mdx.known-issues',
      'mdx.a11y',
      'general.general-a11y',
      'general.general-tokens',
      'general.general-do-dont',
      'general.general-when-to-use',
    ],
  },
  {
    branchName: 'experiment/stories-api-ref',
    facets: [...BASE_FACETS, 'story.api-ref'],
  },
  // There is no showcase story yet, so no point in testing this yet.
  // {
  //   branchName: 'experiment/stories-showcase',
  //   facets: [...BASE_FACETS, 'story.showcase'],
  // },
  {
    branchName: 'experiment/stories-highlight',
    facets: [...BASE_FACETS, 'story.highlight'],
  },
  {
    branchName: 'experiment/stories-examples',
    facets: [...BASE_FACETS, 'story.examples'],
  },
  {
    branchName: 'experiment/stories-full',
    facets: [
      ...BASE_FACETS,
      'story.api-ref',
      'story.showcase',
      'story.highlight',
      'story.examples',
      'story.animation',
    ],
  },
  {
    branchName: 'experiment/purge-jsdoc',
    facets: [
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
      // 'story.playground',
      'story.tests',
      'story.animation',
    ],
  },
  // TODO: we'll build more cases as we grow a better understanding of what facets contribute the most.
  // {
  //   branchName: 'experiment/optimized',
  //   facets: [ TODO ]
  // }
];

export default experiments;
