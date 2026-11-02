import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  let sheetUrl = searchParams.get('url');

  if (!sheetUrl) {
    return NextResponse.json({ error: 'Missing url parameter' }, { status: 400 });
  }

  // Convert standard Google Docs Spreadsheet link to CSV export link
  const match = sheetUrl.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (match && match[1] && !sheetUrl.includes('output=csv')) {
    sheetUrl = `https://docs.google.com/spreadsheets/d/${match[1]}/gviz/tq?tqx=out:csv`;
  }

  try {
    const res = await fetch(sheetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 Nextjs-GoogleSheet-Sync',
      },
      next: { revalidate: 60 } // revalidate every 60s
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: `Google Sheets returned HTTP ${res.status}` },
        { status: res.status }
      );
    }

    const csvData = await res.text();
    return new NextResponse(csvData, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Cache-Control': 's-maxage=60, stale-while-revalidate=300'
      }
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to fetch from Google Sheets', details: error.message },
      { status: 500 }
    );
  }
}
