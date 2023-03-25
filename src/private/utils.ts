export function compareLowerCase(a: string, b: string) {
  return a.localeCompare(b, undefined, { sensitivity: 'base' });
}

export function comparePath(a: string, b: string) {
  if (a[0] < b[0]) {
    return 1;
  }
  return compareLowerCase(a, b);
}
