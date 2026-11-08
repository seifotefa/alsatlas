const ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';

export function isSolanaAddress(value: string): boolean {
  if (!/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(value)) return false;
  let zeros = 0;
  while (zeros < value.length && value[zeros] === '1') zeros += 1;
  const size = Math.ceil((value.length - zeros) * 733 / 1000) + 1;
  const bytes = new Uint8Array(size);
  for (let i = zeros; i < value.length; i += 1) {
    const carryStart = ALPHABET.indexOf(value[i]);
    if (carryStart < 0) return false;
    let carry = carryStart;
    for (let j = size - 1; j >= 0; j -= 1) {
      carry += 58 * bytes[j];
      bytes[j] = carry % 256;
      carry = Math.floor(carry / 256);
    }
    if (carry !== 0) return false;
  }
  let start = 0;
  while (start < bytes.length && bytes[start] === 0) start += 1;
  return zeros + (bytes.length - start) === 32;
}
