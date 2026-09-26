import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: Request, context: any) {
  const params = await context.params;
  const { code } = params;
  const url = new URL(request.url);
  const forwardUrl = new URL(`/api/go/${code}${url.search}`, request.url);
  return NextResponse.rewrite(forwardUrl);
}
