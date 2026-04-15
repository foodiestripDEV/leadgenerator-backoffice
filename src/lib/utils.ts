export function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '');
}

export function fmtDate(iso: string): string {
  const d = new Date(iso);
  return (
    d.toLocaleDateString('it-IT') +
    ' ' +
    d.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })
  );
}
