export async function POST(req: Request) {
  const body = await req.json();
  await fetch('http://localhost:5000/api/log-activity', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return Response.json({ status: 'ok' });
}