async function verifyTurnstile(token, remoteip) {
  const secret = process.env.CLOUDFLARE_TURNSTILE_SECRET_KEY;
  if (!secret) return true; // not configured — skip in dev
  if (!token) return false;

  const body = new URLSearchParams({ secret, response: token, remoteip: remoteip || '' });
  try {
    const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      body: body.toString(),
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });
    const data = await res.json();
    return data.success === true;
  } catch (err) {
    console.error('Turnstile verify error:', err.message);
    return false;
  }
}

module.exports = { verifyTurnstile };
