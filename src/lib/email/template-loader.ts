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
  // Validate templateName and format to prevent path traversal or injection
  const validName = /^[a-zA-Z0-9._-]+$/;
  if (!validName.test(templateName)) {
    throw new Error('Invalid template name');
  }
  if (format !== 'html' && format !== 'txt') {
    throw new Error('Invalid format');
  }

  // Try multiple paths for development and production
  const baseDirs = [
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
    path.join(__dirname, 'templates'),
  ];

  let template: string | null = null;

  for (const baseDir of baseDirs) {
    const templatePath = path.join(baseDir, `${templateName}.${format}`);
    try {
      // Make sure the resolved path is within the candidate directory to avoid
      // path traversal vulnerabilities if templateName was tampered with.
      const resolved = path.resolve(templatePath);
      const resolvedBase = path.resolve(baseDir) + path.sep;
      if (
        !resolved.startsWith(resolvedBase) &&
        resolved !== resolvedBase.slice(0, -1)
      ) {
        continue;
      }

      if (fs.existsSync(resolved)) {
        template = fs.readFileSync(resolved, 'utf-8');
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
