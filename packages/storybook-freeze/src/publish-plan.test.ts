import { describe, expect, it } from 'vitest';
import { planBranchPush } from './publish-plan';

const shas = (entries: Record<string, string>): Map<string, string> =>
  new Map(Object.entries(entries));

describe('planBranchPush', () => {
  it('pushes configured branches that exist locally and reports missing ones', () => {
    const plan = planBranchPush({
      configBranches: ['experiment/empty', 'experiment/base', 'experiment/full'],
      localShas: shas({ main: 'aaa', 'experiment/empty': 'bbb', 'experiment/full': 'ccc' }),
    });
    expect(plan.push).toEqual(['experiment/empty', 'experiment/full']);
    expect(plan.missing).toEqual(['experiment/base']);
    expect(plan.upToDate).toEqual([]);
    expect(plan.stray).toEqual([]);
  });

  it('skips branches whose remote ref already points at the local commit', () => {
    const plan = planBranchPush({
      configBranches: ['experiment/empty', 'experiment/full'],
      localShas: shas({ 'experiment/empty': 'bbb', 'experiment/full': 'ccc' }),
      remoteShas: shas({ 'experiment/empty': 'bbb', 'experiment/full': 'old' }),
    });
    expect(plan.push).toEqual(['experiment/full']);
    expect(plan.upToDate).toEqual(['experiment/empty']);
  });

  it('pushes branches the remote does not have at all', () => {
    const plan = planBranchPush({
      configBranches: ['experiment/new'],
      localShas: shas({ 'experiment/new': 'bbb' }),
      remoteShas: shas({ main: 'aaa' }),
    });
    expect(plan.push).toEqual(['experiment/new']);
    expect(plan.upToDate).toEqual([]);
  });

  it('pushes everything when the remote could not be read', () => {
    const plan = planBranchPush({
      configBranches: ['experiment/empty'],
      localShas: shas({ 'experiment/empty': 'bbb' }),
    });
    expect(plan.push).toEqual(['experiment/empty']);
  });

  it('pushes up-to-date branches when forced', () => {
    const plan = planBranchPush({
      configBranches: ['experiment/empty'],
      localShas: shas({ 'experiment/empty': 'bbb' }),
      remoteShas: shas({ 'experiment/empty': 'bbb' }),
      force: true,
    });
    expect(plan.push).toEqual(['experiment/empty']);
    expect(plan.upToDate).toEqual([]);
  });

  it('flags local experiment branches that are no longer configured as stray', () => {
    const plan = planBranchPush({
      configBranches: ['experiment/empty'],
      localShas: shas({ 'experiment/empty': 'aaa', 'experiment/retired': 'bbb', research: 'ccc' }),
    });
    expect(plan.push).toEqual(['experiment/empty']);
    expect(plan.stray).toEqual(['experiment/retired']);
  });

  it('never pushes non-experiment local branches', () => {
    const plan = planBranchPush({
      configBranches: [],
      localShas: shas({ main: 'aaa', research: 'bbb', 'feature/foo': 'ccc' }),
    });
    expect(plan).toEqual({ push: [], upToDate: [], missing: [], stray: [] });
  });
});
