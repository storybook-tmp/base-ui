import { expect, it, describe, beforeEach, afterEach } from 'vitest';
import { mkdtemp, mkdir, writeFile, readFile, rm, access } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { runCorpus } from './corpus';
import type { Labels } from './labels';

const labels: Labels = {
  offerableFacets: [],
  deleteFacets: new Set(['story.infra']),
  storyTags: new Set(['showcase', 'infra']),
  isDeleteFacet: (f) => f === 'story.infra',
  isKept: (f, keep) => f !== 'story.infra' && keep.has(f),
};

let dir: string;
beforeEach(async () => {
  dir = await mkdtemp(path.join(tmpdir(), 'freeze-corpus-'));
  const stories = path.join(dir, 'apps/storybook/src/stories/checkbox');
  const infra = path.join(dir, 'apps/storybook/src/stories/overview');
  const src = path.join(dir, 'packages/react/src/checkbox');
  await mkdir(stories, { recursive: true });
  await mkdir(infra, { recursive: true });
  await mkdir(src, { recursive: true });

  await writeFile(
    path.join(stories, 'checkbox.stories.tsx'),
    [
      'const meta = { tags: [] } satisfies Meta;',
      'export default meta;',
      'type Story = StoryObj<typeof meta>;',
      "export const Hero: Story = { tags: ['showcase'], render: () => null };",
      "export const Grid: Story = { tags: ['infra'], render: () => null };",
      '',
    ].join('\n'),
  );
  await writeFile(
    path.join(infra, 'gallery.stories.tsx'),
    [
      'const meta = { tags: [] } satisfies Meta;',
      'export default meta;',
      'type Story = StoryObj<typeof meta>;',
      "export const Only: Story = { tags: ['infra'], render: () => null };",
      '',
    ].join('\n'),
  );
  await writeFile(
    path.join(stories, 'checkbox.mdx'),
    [
      '{/* BEGIN: general */}',
      'keep me',
      '{/* END: general */}',
      '',
      '{/* BEGIN: styling */}',
      'drop me',
      '{/* END: styling */}',
      '',
    ].join('\n'),
  );
  await writeFile(
    path.join(src, 'CheckboxRoot.tsx'),
    [
      '/** desc */',
      'export const CheckboxRoot = React.forwardRef(function CheckboxRoot() { return null; });',
      'export namespace CheckboxRoot { export type Props = {}; }',
      '',
    ].join('\n'),
  );
});
afterEach(async () => {
  await rm(dir, { recursive: true, force: true });
});

describe('runCorpus', () => {
  it('drops unkept stories, prunes emptied files, strips mdx sections, and strips source jsdoc', async () => {
    const summary = await runCorpus(dir, new Set(['mdx.general']), labels);

    await expect(
      access(path.join(dir, 'apps/storybook/src/stories/checkbox/checkbox.stories.tsx')),
    ).rejects.toThrow();
    await expect(
      access(path.join(dir, 'apps/storybook/src/stories/overview/gallery.stories.tsx')),
    ).rejects.toThrow();

    const mdx = await readFile(
      path.join(dir, 'apps/storybook/src/stories/checkbox/checkbox.mdx'),
      'utf8',
    );
    expect(mdx).toContain('keep me');
    expect(mdx).not.toContain('drop me');

    const source = await readFile(
      path.join(dir, 'packages/react/src/checkbox/CheckboxRoot.tsx'),
      'utf8',
    );
    expect(source).not.toContain('desc');

    expect(summary.storiesRemoved).toBe(3);
    expect(summary.removed.length).toBe(2);
  });
});

describe('runCorpus dangling MDX imports', () => {
  it('deletes MDX that star-imports a pruned CSF but keeps MDX importing a surviving CSF', async () => {
    const d = await mkdtemp(path.join(tmpdir(), 'freeze-corpus-mdx-'));
    try {
      const buttonDir = path.join(d, 'apps/storybook/src/stories/button');
      const radioDir = path.join(d, 'apps/storybook/src/stories/radio');
      await mkdir(buttonDir, { recursive: true });
      await mkdir(radioDir, { recursive: true });

      await writeFile(
        path.join(buttonDir, 'button.stories.tsx'),
        [
          'const meta = { tags: [] } satisfies Meta;',
          'export default meta;',
          'type Story = StoryObj<typeof meta>;',
          "export const Hero: Story = { tags: ['showcase'], render: () => null };",
          '',
        ].join('\n'),
      );
      await writeFile(
        path.join(buttonDir, 'button.mdx'),
        [
          "import * as ButtonStories from './button.stories';",
          '',
          '<Meta of={ButtonStories} />',
          '',
        ].join('\n'),
      );

      await writeFile(
        path.join(radioDir, 'radio.stories.tsx'),
        [
          'const meta = { tags: [] } satisfies Meta;',
          'export default meta;',
          'type Story = StoryObj<typeof meta>;',
          "export const Only: Story = { tags: ['infra'], render: () => null };",
          '',
        ].join('\n'),
      );
      await writeFile(
        path.join(radioDir, 'radio.mdx'),
        [
          "import * as RadioStories from './radio.stories';",
          '',
          '<Meta of={RadioStories} />',
          '',
        ].join('\n'),
      );

      await runCorpus(d, new Set(['story.showcase']), labels);

      // button.stories keeps its showcase Hero, so its doc must survive.
      await expect(access(path.join(buttonDir, 'button.stories.tsx'))).resolves.toBeUndefined();
      await expect(access(path.join(buttonDir, 'button.mdx'))).resolves.toBeUndefined();

      // radio.stories is pruned (only infra), so its now-dangling doc is deleted too.
      await expect(access(path.join(radioDir, 'radio.stories.tsx'))).rejects.toThrow();
      await expect(access(path.join(radioDir, 'radio.mdx'))).rejects.toThrow();
    } finally {
      await rm(d, { recursive: true, force: true });
    }
  });
});

describe('runCorpus purges Canvas for removed exports', () => {
  it('removes Canvas invocations of removed exports and empties their headings in the sibling MDX', async () => {
    const d = await mkdtemp(path.join(tmpdir(), 'freeze-corpus-canvas-'));
    try {
      const buttonDir = path.join(d, 'apps/storybook/src/stories/button');
      await mkdir(buttonDir, { recursive: true });

      await writeFile(
        path.join(buttonDir, 'button.stories.tsx'),
        [
          'const meta = { tags: [] } satisfies Meta;',
          'export default meta;',
          'type Story = StoryObj<typeof meta>;',
          "export const Hero: Story = { tags: ['showcase'], render: () => null };",
          "export const Extra: Story = { tags: ['highlight'], render: () => null };",
          '',
        ].join('\n'),
      );
      await writeFile(
        path.join(buttonDir, 'button.mdx'),
        [
          "import * as ButtonStories from './button.stories';",
          '',
          '<Meta of={ButtonStories} />',
          '',
          '## Showcase',
          '',
          '<Canvas of={ButtonStories.Hero} />',
          '',
          '### Extra',
          '',
          '<Canvas of={ButtonStories.Extra} />',
          '',
        ].join('\n'),
      );

      await runCorpus(d, new Set(['story.showcase']), labels);

      const mdx = await readFile(path.join(buttonDir, 'button.mdx'), 'utf8');
      expect(mdx).toContain('ButtonStories.Hero');
      expect(mdx).not.toContain('ButtonStories.Extra');
      expect(mdx).not.toContain('### Extra');
      expect(mdx).toContain('## Showcase');
    } finally {
      await rm(d, { recursive: true, force: true });
    }
  });
});
