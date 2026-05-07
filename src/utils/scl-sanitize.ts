export interface SanitizedSource {
  original: string;
  codeOnly: string;
  commentsOnly: string;
}

export function sanitizeScl(content: string): SanitizedSource {
  const chars = [...content];
  const code = [...content];
  const comments = Array.from({ length: chars.length }, () => " ");

  let i = 0;
  while (i < chars.length) {
    if (chars[i] === '"' ) {
      const start = i;
      i++;
      while (i < chars.length) {
        if (chars[i] === '"' ) {
          i++;
          break;
        }
        i++;
      }
      for (let j = start; j < i; j++) code[j] = " ";
      continue;
    }

    if (chars[i] === "(" && chars[i + 1] === "*") {
      const start = i;
      i += 2;
      while (i < chars.length && !(chars[i] === "*" && chars[i + 1] === ")")) {
        i++;
      }
      if (i < chars.length) i += 2;

      for (let j = start; j < i; j++) {
        comments[j] = chars[j];
        code[j] = " ";
      }
      continue;
    }

    if (chars[i] === "/" && chars[i + 1] === "/") {
      const start = i;
      while (i < chars.length && chars[i] !== "\n") i++;
      for (let j = start; j < i; j++) {
        comments[j] = chars[j];
        code[j] = " ";
      }
      continue;
    }

    i++;
  }

  return {
    original: content,
    codeOnly: code.join(""),
    commentsOnly: comments.join("")
  };
}

export function hasUnclosedBlockComment(content: string): number[] {
  const positions: number[] = [];
  let i = 0;
  while (i < content.length) {
    const start = content.indexOf("(*", i);
    if (start === -1) break;
    const end = content.indexOf("*)", start + 2);
    if (end === -1) {
      positions.push(start);
      break;
    }
    i = end + 2;
  }
  return positions;
}
