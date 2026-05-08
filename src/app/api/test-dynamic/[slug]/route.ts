export async function GET(
  req: Request,
  { params }: { params: { slug: string } }
) {
  return Response.json({ ok: true, slug: params.slug });
}