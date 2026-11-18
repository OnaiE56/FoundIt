import 'dotenv/config';
import { networkInterfaces } from 'node:os';
import app from './app.js';

const port = Number(process.env.PORT || 3000);
const mobile = process.argv.includes('--mobile');
const host = mobile ? '0.0.0.0' : process.env.HOST;

const onListening = () => {
  console.log(`[FoundIt] Local server listening on http://localhost:${port}`);

  if (mobile) {
    const addresses = Object.values(networkInterfaces())
      .flatMap((interfaces) => interfaces ?? [])
      .filter((address) => address.family === 'IPv4' && !address.internal)
      .map((address) => address.address);

    if (addresses.length === 0) {
      console.log('[FoundIt] No local network IPv4 address found. Connect this computer to Wi-Fi or Ethernet and restart.');
      return;
    }

    for (const address of addresses) {
      console.log(`[FoundIt] On a device on the same network, open http://${address}:${port}`);
    }
  }
};

if (host) {
  app.listen(port, host, onListening);
} else {
  app.listen(port, onListening);
}
