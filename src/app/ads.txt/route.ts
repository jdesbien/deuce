export function GET() {
  // TODO(owner): after AdSense approval, replace with the line Google
  // provides, e.g.:
  // google.com, pub-XXXXXXXXXXXXXXXX, DIRECT, f08c47fec0942fa0
  return new Response("# ads.txt — pending AdSense approval\n", {
    headers: { "Content-Type": "text/plain" },
  });
}
