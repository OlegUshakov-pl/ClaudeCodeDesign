/** One-shot, one-way receiver. The host grants no privileged object or API. */
function receive(event) {
  const expected = location.ancestorOrigins?.[0];
  if (expected && event.origin !== expected) return;
  if (event.source !== parent || event.data?.type !== 'render-preview' || typeof event.data.html !== 'string' || event.data.html.length > 6_000_000) return;
  removeEventListener('message', receive);
  document.open(); document.write(event.data.html); document.close();
}
addEventListener('message', receive);
