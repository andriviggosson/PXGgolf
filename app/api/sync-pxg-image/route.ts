import { createClient } from '@supabase/supabase-js'

export async function POST(request: Request) {
  const { productId, pxgUrl } = await request.json()

  if (!pxgUrl) return Response.json({ error: 'Missing pxgUrl' }, { status: 400 })

  // Fetch the PXG product page and extract og:image
  let imageUrl: string | null = null
  try {
    const html = await fetch(pxgUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; bot)',
        'Accept': 'text/html',
      },
    }).then(r => r.text())

    // Try og:image first
    const ogMatch = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/)
      || html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/)
    if (ogMatch) imageUrl = ogMatch[1]

    // Fallback: try first product image in JSON-LD
    if (!imageUrl) {
      const jsonLdMatch = html.match(/"image"\s*:\s*"(https[^"]+\.(jpg|jpeg|png|webp))"/)
      if (jsonLdMatch) imageUrl = jsonLdMatch[1]
    }
  } catch (e) {
    return Response.json({ error: 'Could not fetch PXG page' }, { status: 400 })
  }

  if (!imageUrl) return Response.json({ error: 'No image found on page' }, { status: 404 })

  // Download the image
  let blob: Blob
  try {
    const imgRes = await fetch(imageUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } })
    if (!imgRes.ok) return Response.json({ error: 'Image fetch failed' }, { status: 400 })
    blob = await imgRes.blob()
  } catch {
    return Response.json({ error: 'Image download failed' }, { status: 400 })
  }

  // Upload to Supabase
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const ext = blob.type.split('/')[1]?.split('+')[0]?.replace('jpeg', 'jpg') || 'jpg'
  const fileName = `clubs/${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`

  const { error: uploadErr } = await supabase.storage.from('images').upload(fileName, blob, { contentType: blob.type })
  if (uploadErr) return Response.json({ error: uploadErr.message }, { status: 500 })

  const { data: urlData } = supabase.storage.from('images').getPublicUrl(fileName)
  const publicUrl = urlData.publicUrl

  // Update the product if productId provided
  if (productId) {
    await supabase.from('clubs').update({ image_url: publicUrl }).eq('id', productId)
  }

  return Response.json({ url: publicUrl, source: imageUrl })
}
