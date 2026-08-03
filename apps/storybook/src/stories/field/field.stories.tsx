import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, waitFor } from 'storybook/test';
import { Field } from '@base-ui/react/field';
import theme from '@droppy/theme';
import './field.demo.css';
import { FlatPropFieldExample } from './recreations/FlatPropFieldExample';
import { GridLayoutFieldExample } from './recreations/GridLayoutFieldExample';

/**
 * Stories follow research/c-components/field (Tier 1): the docs hero, the forms-handbook
 * labeling and grouping patterns, the validation-mode matrix (onSubmit default per #3013),
 * custom/cross-field/async validate, a control-swap set (Input/Select/Checkbox/textarea),
 * the state-attribute machine, server errors, the RHF-style controlled adapter (#2950),
 * and two real-world recreations picked from the code-ok entries in
 * research/d-real-world-usage/field/ranked.json.
 */
const meta = {
  title: 'Form inputs/Field',
  component: Field.Root,
  subcomponents: {
    'Field.Label': Field.Label,
    'Field.Control': Field.Control,
    'Field.Description': Field.Description,
    'Field.Error': Field.Error,
    'Field.Item': Field.Item,
    'Field.Validity': Field.Validity,
  },
} satisfies Meta<typeof Field.Root>;

export default meta;
type Story = StoryObj<typeof meta>;

/* ------------------------------------------------------------------ */
/* Anatomy & labeling                                                  */
/* ------------------------------------------------------------------ */

/** The docs hero demo: label, control, error, and description — all id/aria wiring is automatic. */
export const Hero: Story = {
  tags: ['showcase', 'base'],
  render: () => (
    <Field.Root className={theme.FieldRoot}>
      <Field.Label className={theme.FieldLabel}>Name</Field.Label>
      <Field.Control required placeholder="Required" className={theme.Input} />

      <Field.Error className={theme.FieldError} match="valueMissing">
        Please enter your name
      </Field.Error>

      <Field.Description className={theme.FieldDescription}>
        Visible on your profile
      </Field.Description>
    </Field.Root>
  ),
};

/* ------------------------------------------------------------------ */
/* Validation modes                                                    */

/* ------------------------------------------------------------------ */

/* ------------------------------------------------------------------ */
/* Wrapping controls                                                   */

/* ------------------------------------------------------------------ */
/* State attributes, server errors, external libraries, animation      */

/* ------------------------------------------------------------------ */
/* Real-world recreations (research/d-real-world-usage/field)          */
/* ------------------------------------------------------------------ */

/**
 * Recreation of a design-system wrapper: the whole composition collapses into one flat
 * prop set (`label`, `required`, `description`, `errorMessage`, `hideLabel`) instead of
 * exposing `Field.Label`/`Field.Description`/`Field.Error` as JSX children, with a
 * `hideLabel` escape hatch for controls that supply their own accessible label.
 * Recomposed from the ideas in cloudflare/kumo `field.tsx` (MIT, code-ok,
 * research/d-real-world-usage/field/ranked.json #1).
 */
export const RealWorldFlatPropWrapper: Story = {
  tags: ['recreation', 'examples'],
  render: () => <FlatPropFieldExample />,
  play: async ({ canvas, userEvent }) => {
    const fullName = canvas.getByLabelText('Full name');
    // hideLabel renders no visible/associated Field.Label — the control names itself.
    const search = canvas.getByRole('textbox', { name: 'Search' });
    await expect(canvas.queryByText('Search')).not.toBeInTheDocument();

    await userEvent.click(canvas.getByRole('button', { name: 'Save' }));
    await expect(await canvas.findByText('Please enter your full name.')).toBeVisible();
    await expect(canvas.getByText('Please enter a search term.')).toBeVisible();

    await userEvent.type(fullName, 'Ada Lovelace');
    await userEvent.type(search, 'field');
    await userEvent.click(canvas.getByRole('button', { name: 'Save' }));

    await expect(await canvas.findByText('Saved')).toBeVisible();
    await expect(canvas.queryByText('Please enter your full name.')).not.toBeInTheDocument();
  },
};

/**
 * Recreation of a `grid-cols-[auto_1fr]` field layout: description/error text is pinned
 * to the second column so it aligns under the control (next to its leading icon) rather
 * than under the label — an alternative to the vertical-stack layout every other story
 * on this page uses. Recomposed from the ideas in nauvalazhar/selia `field.tsx` (MIT,
 * code-ok, research/d-real-world-usage/field/ranked.json #6).
 */
export const RealWorldGridLayout: Story = {
  tags: ['recreation', 'examples'],
  render: () => <GridLayoutFieldExample />,
  play: async ({ canvas, userEvent }) => {
    const input = canvas.getByLabelText('Search the docs');

    await userEvent.type(input, 'x');
    await userEvent.clear(input);
    await expect(await canvas.findByText('A search term is required.')).toBeVisible();

    await userEvent.type(input, 'useRender');
    await waitFor(() =>
      expect(canvas.queryByText('A search term is required.')).not.toBeInTheDocument(),
    );
  },
};

/* ------------------------------------------------------------------ */
/* Icons (inline SVGs, matching the docs demos)                        */
