import { createClient } from '@supabase/supabase-js'

export async function POST(request: Request) {
  const { url } = await request.json()
  if (!url || typeof url !== 'string' || !url.startsWith('http')) {
    return Response.json({ error: 'Invalid URL' }, { status: 400 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  let imageBlob: Blob
  try {
    const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } })
    if (!res.ok) return Response.json({ error: 'Could not fetch image' }, { status: 400 })
    imageBlob = await res.blob()
  } catch {
    return Response.json({ error: 'Fetch failed' }, { status: 400 })
  }

  const ext = imageBlob.type.split('/')[1]?.split('+')[0]?.replace('jpeg', 'jpg') || 'jpg'
  const fileName = `clubs/${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`

  const { error } = await supabase.storage.from('images').upload(fileName, imageBlob, {
    contentType: imageBlob.type,
    upsert: false,
  })
  if (error) return Response.json({ error: error.message }, { status: 500 })

  const { data } = supabase.storage.from('images').getPublicUrl(fileName)
  return Response.json({ url: data.publicUrl })
}
