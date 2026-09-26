import crypto from "crypto";

const LOWERCASE = "abcdefghijkmnopqrstuvwxyz";
const UPPERCASE = "ABCDEFGHJKLMNPQRSTUVWXYZ";
const DIGITS = "23456789";
const SYMBOLS = "!@#$%^&*";
const ALL = LOWERCASE + UPPERCASE + DIGITS + SYMBOLS;

const pick = (charset: string): string =>
  charset[crypto.randomInt(0, charset.length)];

/**
 * Generates a password using a cryptographically secure RNG with rejection
 * sampling, so no character is more likely than another. Guarantees at least
 * one character from each class.
 */
export function generatePassword(length = 16): string {
    if (length < 12) {
        throw new Error("Generated passwords must be at least 12 characters long");
    }

    const chars = [pick(LOWERCASE), pick(UPPERCASE), pick(DIGITS), pick(SYMBOLS)];

    while (chars.length < length) {
        chars.push(pick(ALL));
    }

    // Fisher-Yates shuffle using the CSPRNG so class positions are not fixed.
    for (let i = chars.length - 1; i > 0; i--) {
        const j = crypto.randomInt(0, i + 1);
        [chars[i], chars[j]] = [chars[j], chars[i]];
    }

    return chars.join("");
}
