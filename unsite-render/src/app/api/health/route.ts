import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json(
    {
      status: 'ok',
      service: 'unsite',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    },
    { status: 200 }
  )
}
