import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, waitFor } from 'storybook/test';
import { Accordion } from '@base-ui/react/accordion';
import theme from '@droppy/theme';
import './accordion.demo.css';

/**
 * Stories follow research/c-components/accordion (Tier 2): the hero FAQ demo
 * (single-open by default), the `multiple` behavior (two panels open at
 * once), and a disabled item.
 *
 * Accordion deliberately does NOT support arrow-key navigation between
 * headers — mui/base-ui#4965 removed roving focus to align with the current
 * W3C APG Accordion pattern (w3c/aria-practices#3434), and the companion
 * #4961 removed `role="region"` from `Accordion.Root` (it already lived
 * correctly on `Accordion.Panel`). Only Tab/Shift+Tab moves focus between
 * triggers — these stories never assert arrow-key behavior.
 */
const meta = {
  title: 'Disclosure & structure/Accordion',
  component: Accordion.Root,
  subcomponents: {
    'Accordion.Item': Accordion.Item,
    'Accordion.Header': Accordion.Header,
    'Accordion.Trigger': Accordion.Trigger,
    'Accordion.Panel': Accordion.Panel,
  },
} satisfies Meta<typeof Accordion.Root>;

export default meta;
type Story = StoryObj<typeof meta>;

function PlusIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeLinecap="square"
      strokeLinejoin="round"
      {...props}
      style={{ display: 'block', ...props.style }}
    >
      <path d="M1.5 8h13M8 14.5v-13" />
    </svg>
  );
}

const faqItems = [
  {
    value: 'what-is',
    question: 'What is Base UI?',
    answer:
      'Base UI is a library of high-quality unstyled React components for design systems and web apps.',
  },
  {
    value: 'get-started',
    question: 'How do I get started?',
    answer:
      "Head to the Quick start guide in the docs. If you've used unstyled libraries before, you'll feel at home.",
  },
  {
    value: 'my-project',
    question: 'Can I use it for my project?',
    answer: 'Of course! Base UI is free and open source.',
  },
] as const;

/**
 * The docs hero demo: a 3-item FAQ accordion, single-open by default
 * (`multiple` is omitted, so opening one item always replaces the value
 * array rather than stacking).
 */
export const Hero: Story = {
  tags: ['showcase', 'base'],
  render: () => (
    <Accordion.Root className={theme.AccordionRoot} defaultValue={['what-is']}>
      {faqItems.map((item) => (
        <Accordion.Item key={item.value} value={item.value} className={theme.AccordionItem}>
          <Accordion.Header className={theme.AccordionHeader}>
            <Accordion.Trigger className={theme.AccordionTrigger}>
              {item.question}
              <PlusIcon className={theme.AccordionIcon} />
            </Accordion.Trigger>
          </Accordion.Header>
          <Accordion.Panel className={theme.AccordionPanel}>
            <div className={theme.AccordionContent}>{item.answer}</div>
          </Accordion.Panel>
        </Accordion.Item>
      ))}
    </Accordion.Root>
  ),
  play: async ({ canvas, userEvent }) => {
    // Item 1 starts open (defaultValue=['what-is']).
    await expect(canvas.getByText(faqItems[0].answer)).toBeVisible();

    const trigger2 = canvas.getByRole('button', { name: faqItems[1].question });
    await expect(trigger2).toHaveAttribute('aria-expanded', 'false');
    await userEvent.click(trigger2);

    // Single-open mode: opening item 2 replaces item 1 in the value array.
    // Panel height animates via `--accordion-panel-height`, so wait for the
    // transition to finish before asserting either side of the swap.
    await waitFor(() => expect(trigger2).toHaveAttribute('aria-expanded', 'true'));
    await waitFor(() => expect(canvas.getByText(faqItems[1].answer)).toBeVisible());
    await waitFor(() => expect(canvas.queryByText(faqItems[0].answer)).not.toBeInTheDocument());
  },
};

/**
 * `multiple` allows more than one panel to be open simultaneously — opening
 * item 2 no longer replaces item 1's open state.
 */
export const OpenMultiple: Story = {
  tags: ['api-ref', 'base'],
  render: () => (
    <Accordion.Root className={theme.AccordionRoot} multiple>
      {faqItems.map((item) => (
        <Accordion.Item key={item.value} value={item.value} className={theme.AccordionItem}>
          <Accordion.Header className={theme.AccordionHeader}>
            <Accordion.Trigger className={theme.AccordionTrigger}>
              {item.question}
              <PlusIcon className={theme.AccordionIcon} />
            </Accordion.Trigger>
          </Accordion.Header>
          <Accordion.Panel className={theme.AccordionPanel}>
            <div className={theme.AccordionContent}>{item.answer}</div>
          </Accordion.Panel>
        </Accordion.Item>
      ))}
    </Accordion.Root>
  ),
  play: async ({ canvas, userEvent }) => {
    const trigger1 = canvas.getByRole('button', { name: faqItems[0].question });
    const trigger2 = canvas.getByRole('button', { name: faqItems[1].question });

    await userEvent.click(trigger1);
    await waitFor(() => expect(trigger1).toHaveAttribute('aria-expanded', 'true'));
    await waitFor(() => expect(canvas.getByText(faqItems[0].answer)).toBeVisible());

    await userEvent.click(trigger2);
    await waitFor(() => expect(trigger2).toHaveAttribute('aria-expanded', 'true'));

    // Both panels are open simultaneously — the defining behavior of `multiple`.
    await waitFor(() => expect(canvas.getByText(faqItems[0].answer)).toBeVisible());
    await waitFor(() => expect(canvas.getByText(faqItems[1].answer)).toBeVisible());
  },
};

/**
 * The Panel's height is driven entirely by `--accordion-panel-height`
 * (`AccordionPanelCssVars`), the same measurement engine Collapsible uses.
 * This asserts the mechanism directly: the panel's rendered height grows from
 * `0` while opening and settles back to `0` while closing, rather than just
 * asserting the CSS recipe is present in the stylesheet.
 */
export const AnimatedPanelHeight: Story = {
  tags: ['animation'],
  render: () => (
    <Accordion.Root className={theme.AccordionRoot} defaultValue={[]}>
      <Accordion.Item value={faqItems[0].value} className={theme.AccordionItem}>
        <Accordion.Header className={theme.AccordionHeader}>
          <Accordion.Trigger className={theme.AccordionTrigger}>
            {faqItems[0].question}
            <PlusIcon className={theme.AccordionIcon} />
          </Accordion.Trigger>
        </Accordion.Header>
        <Accordion.Panel className={theme.AccordionPanel} data-testid="animated-panel" keepMounted>
          <div className={theme.AccordionContent}>{faqItems[0].answer}</div>
        </Accordion.Panel>
      </Accordion.Item>
    </Accordion.Root>
  ),
  play: async ({ canvasElement, canvas, userEvent }) => {
    // `keepMounted` keeps the panel present (but hidden) at all times, so
    // its height can be measured before the very first open.
    const panel = canvasElement.querySelector('[data-testid="animated-panel"]') as HTMLElement;
    const trigger = canvas.getByRole('button', { name: faqItems[0].question });

    await expect(panel.getBoundingClientRect().height).toBe(0);

    await userEvent.click(trigger);
    await waitFor(() => expect(trigger).toHaveAttribute('aria-expanded', 'true'));
    await waitFor(() => expect(panel.getBoundingClientRect().height).toBeGreaterThan(0));
    // `--accordion-panel-height` mirrors the measured content height while open.
    await waitFor(() =>
      expect(panel.style.getPropertyValue('--accordion-panel-height')).not.toBe('0px'),
    );

    await userEvent.click(trigger);
    await waitFor(() => expect(trigger).toHaveAttribute('aria-expanded', 'false'));
    await waitFor(() => expect(panel.getBoundingClientRect().height).toBe(0));
  },
};
