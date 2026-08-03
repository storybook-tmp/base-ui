import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, waitFor } from 'storybook/test';
import { Form } from '@base-ui/react/form';
import { Field } from '@base-ui/react/field';
import { Button } from '@base-ui/react/button';
import theme from '@droppy/theme';
import './form.demo.css';

/**
 * Stories follow research/c-components/form (Tier 1): the kept docs demos (hero,
 * Server Function action, Zod-style schema mapping) plus one story per documented
 * use case — submit gating with focus-first-invalid, the `errors` prop lifecycle,
 * `onFormSubmit` payload assembly, the `validationMode` cascade, imperative
 * validation via `actionsRef`, the `noValidate` boundary, a react-hook-form style
 * integration, and two real-world recreations picked from the code-ok entries in
 * research/d-real-world-usage/form/ranked.json.
 */
const meta = {
  title: 'Form inputs/Form',
  component: Form,
} satisfies Meta<typeof Form>;

export default meta;
type Story = StoryObj<typeof meta>;

/* ------------------------------------------------------------------ */
/* Hero (docs demo)                                                    */
/* ------------------------------------------------------------------ */

async function submitUrlForm(value: string) {
  // Mimic a server response (docs hero demo, shortened delay for tests)
  await new Promise((resolve) => {
    setTimeout(resolve, 300);
  });

  try {
    const url = new URL(value);

    if (url.hostname.endsWith('example.com')) {
      return { error: 'The example domain is not allowed' };
    }
  } catch {
    return { error: 'This is not a valid URL' };
  }

  return { error: undefined };
}

function HeroExample() {
  const [errors, setErrors] = React.useState<Form.Props['errors']>({});
  const [loading, setLoading] = React.useState(false);

  return (
    <Form
      className={theme.FormRoot}
      errors={errors}
      onSubmit={async (event) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        const value = formData.get('url') as string;

        setLoading(true);
        const response = await submitUrlForm(value);
        setErrors(response.error ? { url: response.error } : {});
        setLoading(false);
      }}
    >
      <Field.Root name="url" className={theme.FieldRoot}>
        <Field.Label className={theme.FieldLabel}>Homepage</Field.Label>
        <Field.Control
          type="url"
          required
          defaultValue="https://example.com"
          placeholder="https://example.com"
          pattern="https?://.*"
          className={theme.Input}
        />
        <Field.Error className={theme.FieldError} />
      </Field.Root>
      <Button type="submit" disabled={loading} focusableWhenDisabled className={theme.Button}>
        Submit
      </Button>
    </Form>
  );
}

/**
 * The docs hero demo: a URL field with native constraints (`required`, `type="url"`,
 * `pattern`) submitted to a mock server whose error lands in the `errors` prop.
 * Editing the field clears the server error optimistically.
 */
export const Hero: Story = {
  tags: ['showcase', 'base'],
  render: () => <HeroExample />,
  play: async ({ canvas, userEvent }) => {
    const input = canvas.getByLabelText('Homepage');
    await expect(input).toHaveValue('https://example.com');

    await userEvent.click(canvas.getByRole('button', { name: 'Submit' }));
    await expect(await canvas.findByText('The example domain is not allowed')).toBeVisible();

    // Server errors auto-clear as soon as the field value changes (#3136).
    await userEvent.type(input, 'x');
    await waitFor(async () => {
      await expect(canvas.queryByText('The example domain is not allowed')).not.toBeInTheDocument();
    });
  },
};

/* ------------------------------------------------------------------ */
/* Submit gate flow                                                    */

/* ------------------------------------------------------------------ */
/* Server errors                                                       */

/* ------------------------------------------------------------------ */
/* Server Function / useActionState                                    */
/* ------------------------------------------------------------------ */

interface ActionState {
  serverErrors?: Form.Props['errors'];
}

// Mark this as a Server Function with 'use server' in a supporting framework like Next.js
async function submitUsernameAction(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  // Mimic a server response (docs form-action demo, made deterministic for tests)
  await new Promise((resolve) => {
    setTimeout(resolve, 300);
  });

  const username = formData.get('username') as string | null;

  if (username === 'admin') {
    return { serverErrors: { username: "'admin' is reserved for system use" } };
  }

  return {};
}

function ServerFunctionExample() {
  const [state, formAction, loading] = React.useActionState<ActionState, FormData>(
    submitUsernameAction,
    {},
  );

  return (
    <Form errors={state.serverErrors} action={formAction} className={theme.FormRoot}>
      <Field.Root name="username" className={theme.FieldRoot}>
        <Field.Label className={theme.FieldLabel}>Username</Field.Label>
        <Field.Control
          type="text"
          autoComplete="username"
          required
          defaultValue="admin"
          placeholder="e.g. alice132"
          className={theme.Input}
        />
        <Field.Error className={theme.FieldError} />
      </Field.Root>
      <Button type="submit" disabled={loading} focusableWhenDisabled className={theme.Button}>
        Submit
      </Button>
    </Form>
  );
}

/**
 * The docs `form-action` demo shape: `useActionState` supplies `action` and the
 * returned server errors feed the `errors` prop — viable precisely because errors
 * auto-clear on change (#3136). After submission lands, Form focuses the invalid field.
 */
export const ServerFunctionAction: Story = {
  tags: ['highlight', 'base'],
  render: () => <ServerFunctionExample />,
  play: async ({ canvas, userEvent }) => {
    const input = canvas.getByLabelText('Username');

    await userEvent.click(canvas.getByRole('button', { name: 'Submit' }));
    await expect(await canvas.findByText("'admin' is reserved for system use")).toBeVisible();

    // After a submitted form receives new errors, the first invalid field is focused.
    await waitFor(async () => {
      await expect(input).toHaveFocus();
    });

    // Typing clears the server error optimistically.
    await userEvent.type(input, 'x');
    await waitFor(async () => {
      await expect(
        canvas.queryByText("'admin' is reserved for system use"),
      ).not.toBeInTheDocument();
    });
  },
};

/* ------------------------------------------------------------------ */
/* Schema validation at submit (Zod shape)                             */
/* ------------------------------------------------------------------ */

/**
 * Stand-in for the docs Zod demo without the dependency: `z.flattenError(result.error)
 * .fieldErrors` produces exactly this shape — arrays of messages keyed by field name.
 */
function safeParseProfile(values: Form.Values) {
  const fieldErrors: Record<string, string[]> = {};

  if (typeof values.name !== 'string' || values.name.length < 1) {
    fieldErrors.name = ['Name is required'];
  }

  const age = Number(values.age);
  if (Number.isNaN(age)) {
    fieldErrors.age = ['Age must be a number'];
  } else if (age <= 0) {
    fieldErrors.age = ['Age must be a positive number'];
  }

  const success = Object.keys(fieldErrors).length === 0;
  return { success, fieldErrors };
}

function SchemaMappingExample() {
  const [errors, setErrors] = React.useState<Form.Props['errors']>({});
  const [result, setResult] = React.useState<string | null>(null);

  return (
    <Form
      className={theme.FormRoot}
      errors={errors}
      onFormSubmit={(formValues) => {
        const parsed = safeParseProfile(formValues);
        setErrors(parsed.fieldErrors);
        setResult(parsed.success ? `Valid: ${JSON.stringify(formValues)}` : null);
      }}
    >
      <Field.Root name="name" className={theme.FieldRoot}>
        <Field.Label className={theme.FieldLabel}>Name</Field.Label>
        <Field.Control placeholder="Enter name" className={theme.Input} />
        <Field.Error className={theme.FieldError} />
      </Field.Root>
      <Field.Root name="age" className={theme.FieldRoot}>
        <Field.Label className={theme.FieldLabel}>Age</Field.Label>
        <Field.Control placeholder="Enter age" className={theme.Input} />
        <Field.Error className={theme.FieldError} />
      </Field.Root>
      <button type="submit" className={theme.Button}>
        Submit
      </button>
      {result ? <output className="FormDemoOutput">{result}</output> : null}
    </Form>
  );
}

/**
 * Schema validation at submit time, mapped into `errors` (the docs "Using with Zod"
 * flow): parse in `onFormSubmit`, feed `fieldErrors` to the prop. Fixing one field
 * clears only that field's error.
 */
export const ZodSchemaMapping: Story = {
  tags: ['highlight', 'base'],
  render: () => <SchemaMappingExample />,
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Submit' }));
    await expect(await canvas.findByText('Name is required')).toBeVisible();
    await expect(canvas.getByText('Age must be a positive number')).toBeVisible();

    // Fixing only the name clears only the name's error; the age error stays.
    await userEvent.type(canvas.getByLabelText('Name'), 'Jane');
    await waitFor(async () => {
      await expect(canvas.queryByText('Name is required')).not.toBeInTheDocument();
    });
    await expect(canvas.getByText('Age must be a positive number')).toBeVisible();
  },
};

/* ------------------------------------------------------------------ */
/* onFormSubmit payload                                                */

/* ------------------------------------------------------------------ */
/* validationMode cascade                                              */

/* ------------------------------------------------------------------ */
/* Imperative validation                                               */

/* ------------------------------------------------------------------ */
/* noValidate boundary                                                 */
/* ------------------------------------------------------------------ */

/* ------------------------------------------------------------------ */
/* react-hook-form style integration                                   */
/* ------------------------------------------------------------------ */

interface RhfRules {
  required?: string;
  minLength?: { value: number; message: string };
}

interface RhfFieldState {
  invalid: boolean;
  isTouched: boolean;
  isDirty: boolean;
  error?: { message: string };
}

interface RhfField {
  name: string;
  value: string;
  ref: (element: HTMLInputElement | null) => void;
  onChange: (value: string) => void;
  onBlur: () => void;
}

/* ------------------------------------------------------------------ */
/* Real-world recreations (research/d-real-world-usage/form)           */
/* ------------------------------------------------------------------ */
