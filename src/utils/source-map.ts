export function getLineColumn(content: string, index: number): { line: number; column: number } {
  const before = content.slice(0, index);
  const lines = before.split(/\r?\n/);
  return { line: lines.length, column: lines[lines.length - 1].length + 1 };
}

export function getLineExcerpt(content: string, line: number): string {
  const lines = content.split(/\r?\n/);
  return (lines[line - 1] ?? "").trim();
}
