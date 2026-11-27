// Carries the original authorization request through the sign-in form: every
// query parameter that is not a form field is added as a hidden field.
const form = document.querySelector('form');

for (const [key, value] of new URLSearchParams(location.search)) {
  if (form.elements.namedItem(key)) continue;
  const field = document.createElement('input');
  field.type = 'hidden';
  field.name = key;
  field.value = value;
  form.append(field);
}
