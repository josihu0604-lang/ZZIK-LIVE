export const runtime = 'edge';

/**
 * 매장 목록 API (데모 데이터)
 * GET /api/stores
 */
export async function GET() {
  const stores = [
    {
      id: 'gangnam',
      name: 'ZZIK Coffee 강남',
      lat: 37.4979,
      lng: 127.0276,
      radius: 120,
    },
    {
      id: 'seongsu',
      name: 'ZZIK Pizza 성수',
      lat: 37.5446,
      lng: 127.0565,
      radius: 120,
    },
    {
      id: 'hongdae',
      name: 'ZZIK Tea 홍대',
      lat: 37.5563,
      lng: 126.9220,
      radius: 120,
    },
  ];

  return new Response(JSON.stringify({ ok: true, stores }), {
    headers: { 'content-type': 'application/json' },
  });
}
