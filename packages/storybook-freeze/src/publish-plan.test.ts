import { describe, expect, it } from 'vitest';
import { planBranchPush } from './publish-plan';

describe('planBranchPush', () => {
  it('pushes configured branches that exist locally and reports missing ones', () => {
    const plan = planBranchPush(
      ['experiment/empty', 'experiment/base', 'experiment/full'],
      ['main', 'experiment/empty', 'experiment/full'],
    );
    expect(plan.push).toEqual(['experiment/empty', 'experiment/full']);
    expect(plan.missing).toEqual(['experiment/base']);
    expect(plan.stray).toEqual([]);
  });

  it('flags local experiment branches that are no longer configured as stray', () => {
    const plan = planBranchPush(
      ['experiment/empty'],
      ['experiment/empty', 'experiment/retired', 'research'],
    );
    expect(plan.push).toEqual(['experiment/empty']);
    expect(plan.stray).toEqual(['experiment/retired']);
  });

  it('never pushes non-experiment local branches', () => {
    const plan = planBranchPush([], ['main', 'research', 'feature/foo']);
    expect(plan).toEqual({ push: [], missing: [], stray: [] });
  });
});
