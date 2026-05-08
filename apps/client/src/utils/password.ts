const LOWER = "abcdefghijklmnopqrstuvwxyz";
const UPPER = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const DIGIT = "0123456789";
const SYMBOL = "!@#$%^&*-_+=?";
const ALL = LOWER + UPPER + DIGIT + SYMBOL;

function pick(charset: string, randomU32: number): string {
  const idx = randomU32 % charset.length;
  return charset.slice(idx, idx + 1);
}

export function generateStrongPassword(length = 16): string {
  if (length < 4) {
    throw new Error("Password length must be at least 4");
  }
  const buffer = new Uint32Array(length);
  crypto.getRandomValues(buffer);

  const chars: string[] = [
    pick(LOWER, buffer[0] ?? 0),
    pick(UPPER, buffer[1] ?? 0),
    pick(DIGIT, buffer[2] ?? 0),
    pick(SYMBOL, buffer[3] ?? 0),
  ];
  for (let i = 4; i < length; i++) {
    chars.push(pick(ALL, buffer[i] ?? 0));
  }

  const shuffleBuf = new Uint32Array(length);
  crypto.getRandomValues(shuffleBuf);
  for (let i = length - 1; i > 0; i--) {
    const j = (shuffleBuf[i] ?? 0) % (i + 1);
    const tmp = chars[i] ?? "";
    chars[i] = chars[j] ?? "";
    chars[j] = tmp;
  }
  return chars.join("");
}
