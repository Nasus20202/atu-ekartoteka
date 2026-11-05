import fs from 'fs';
import path from 'path';

const TEMPLATE_NAMES = [
  'verification-email',
  'password-reset',
  'account-approved',
  'account-activation',
  'new-user-registration-admin',
] as const;

export type TemplateName = (typeof TEMPLATE_NAMES)[number];

function loadTemplates(): Record<TemplateName, string> {
  const templates = {} as Record<TemplateName, string>;

  for (const templateName of TEMPLATE_NAMES) {
    templates[templateName] = fs.readFileSync(
      path.join(
        process.cwd(),
        'src',
        'lib',
        'email',
        'templates',
        `${templateName}.txt`
      ),
      'utf-8'
    );
  }

  return templates;
}

const templates = loadTemplates();

export function renderEmailTemplate(
  templateName: TemplateName,
  variables: Record<string, string>
): string {
  let result = templates[templateName];
  for (const [key, value] of Object.entries(variables)) {
    result = result.replaceAll(`{{${key}}}`, () => value);
  }

  return result;
}
