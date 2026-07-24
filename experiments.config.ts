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
];

export default experiments;
