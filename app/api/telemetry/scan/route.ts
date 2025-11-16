export const runtime = 'edge';

/**
 * 스캔 텔레메트리 수집
 * POST /api/telemetry/scan
 */
export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as {
    items?: { decodeMs?: number; avgLum?: number; source?: string }[];
  } | null;

  if (!body?.items?.length) {
    return new Response(null, { status: 204 });
  }

  // TODO: ClickHouse/BigQuery 적재
  console.log(
    '[telemetry.scan]',
    body.items.slice(0, 3),
    `(+${Math.max(0, body.items.length - 3)})`
  );

  return new Response(null, { status: 204 });
}
