export async function GET(req: Request) {
  const userId = new URL(req.url).searchParams.get('userId');
  const res = await fetch(`/api/recommendations?user_id=${userId}`);
  const data = await res.json();
  return Response.json(data);
}