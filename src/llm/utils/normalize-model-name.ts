export function normalizeModelName(model: string): string {
  const beforeSlash = model.split('/')[0];
  return beforeSlash.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
}
