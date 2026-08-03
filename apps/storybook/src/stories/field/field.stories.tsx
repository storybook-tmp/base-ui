import type { Meta, StoryObj } from '@storybook/react-vite';
import { Field } from '@base-ui/react/field';
import theme from '@droppy/theme';
import './field.demo.css';

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

/* ------------------------------------------------------------------ */
/* Icons (inline SVGs, matching the docs demos)                        */
