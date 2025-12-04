// api/utils/payos.js
import { PayOS } from '@payos/node';

if (
  !process.env.PAYOS_CLIENT_ID ||
  !process.env.PAYOS_API_KEY ||
  !process.env.PAYOS_CHECKSUM_KEY
) {
  console.warn('⚠️ PAYOS ENV is missing. Integration will not work correctly.');
}

const payOS = new PayOS({
  clientId: process.env.PAYOS_CLIENT_ID,
  apiKey: process.env.PAYOS_API_KEY,
  checksumKey: process.env.PAYOS_CHECKSUM_KEY,
});

export default payOS;
