import fs from 'fs';
import path from 'path';

/**
 * Load and render email template
 * Works in both development and production builds
 */
export function renderEmailTemplate(
  templateName: string,
  format: 'html' | 'txt',
  variables: Record<string, string>
): string {
  // Try multiple paths for development and production
  const possiblePaths = [
    // Development path
    path.join(
      process.cwd(),
      'src',
      'lib',
      'email',
      'templates',
      `${templateName}.${format}`
    ),
    // Production build path (standalone)
    path.join(
      process.cwd(),
      '.next',
      'standalone',
      'src',
      'lib',
      'email',
      'templates',
      `${templateName}.${format}`
    ),
    // Production build path (server)
    path.join(
      process.cwd(),
      '.next',
      'server',
      'src',
      'lib',
      'email',
      'templates',
      `${templateName}.${format}`
    ),
    // Relative to this file
    path.join(__dirname, 'templates', `${templateName}.${format}`),
  ];

  let template: string | null = null;

  for (const templatePath of possiblePaths) {
    try {
      if (fs.existsSync(templatePath)) {
        template = fs.readFileSync(templatePath, 'utf-8');
        break;
      }
    } catch {
      // Continue to next path
      continue;
    }
  }

  if (!template) {
    throw new Error(`Email template not found: ${templateName}.${format}`);
  }

  // Replace variables
  for (const [key, value] of Object.entries(variables)) {
    const placeholder = `{{${key}}}`;
    template = template.replace(new RegExp(placeholder, 'g'), value);
  }

  return template;
}
