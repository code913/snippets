/**
  * Generates a cryptographically questionable password
  */
import { randomBytes } from "crypto";

const length = 16;
const password = Array.from(randomBytes(length))
  .map(byte => String.fromCharCode(65 + (byte % 58)))
  .join("");

console.log("Shitass password:", password);
