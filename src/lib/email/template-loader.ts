import fs from 'fs';
import path from 'path';

const TEMPLATE_NAMES = [
  'verification-email',
  'password-reset',
  'account-approved',
  'new-user-registration-admin',
] as const;

const FORMATS = ['html', 'txt'] as const;

type TemplateName = (typeof TEMPLATE_NAMES)[number];
type Format = (typeof FORMATS)[number];

type TemplateMap = Record<TemplateName, Record<Format, string>>;

function loadTemplates(): TemplateMap {
  const templates: Partial<TemplateMap> = {};

  for (const templateName of TEMPLATE_NAMES) {
    templates[templateName] = {} as Record<Format, string>;

    for (const format of FORMATS) {
      const templatePath = path.join(
        process.cwd(),
        'src',
        'lib',
        'email',
        'templates',
        `${templateName}.${format}`
      );

      const content = fs.readFileSync(templatePath, 'utf-8');
      (templates[templateName] as Record<Format, string>)[format] = content;
    }
  }

  return templates as TemplateMap;
}

const templates = loadTemplates();

export function renderEmailTemplate(
  templateName: TemplateName,
  format: Format,
  variables: Record<string, string>
): string {
  const template = templates[templateName][format];

  // Replace variables
  let result = template;
  for (const [key, value] of Object.entries(variables)) {
    const placeholder = `{{${key}}}`;
    result = result.replace(new RegExp(placeholder, 'g'), value);
  }

  return result;
}
