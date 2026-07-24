/**
 * Generates the RS256 keypair Convex Auth uses to sign login tokens.
 *
 *   node scripts/generateKeys.mjs
 *
 * Prints JWT_PRIVATE_KEY and JWKS. Set both on the Convex deployment
 * (not Netlify, not .env.local) — see .context/integrations.md:
 *
 *   npx convex env set JWT_PRIVATE_KEY -- "<value>"
 *   npx convex env set JWKS -- '<value>'
 *
 * Add --prod to target the production deployment instead of dev.
 *
 * Generate a SEPARATE keypair per deployment. Never reuse the dev keys in
 * production, and never commit either value.
 *
 * Zero dependencies — uses Node's built-in crypto so it runs the same on
 * Windows and macOS without an install step.
 */
import { generateKeyPairSync } from "node:crypto";

const { privateKey, publicKey } = generateKeyPairSync("rsa", {
  modulusLength: 2048,
});

// Convex Auth expects the PKCS8 PEM with newlines flattened to spaces.
const pkcs8 = privateKey
  .export({ type: "pkcs8", format: "pem" })
  .toString()
  .trimEnd()
  .replace(/\n/g, " ");

const jwk = publicKey.export({ format: "jwk" });
const jwks = JSON.stringify({
  keys: [{ use: "sig", alg: "RS256", ...jwk }],
});

console.log("JWT_PRIVATE_KEY:");
console.log(pkcs8);
console.log();
console.log("JWKS:");
console.log(jwks);
