import { supabase } from './supabase'

export async function uploadImage(file: File, folder = 'clubs'): Promise<string | null> {
  const fileExt = file.name.split('.').pop()
  const fileName = `${folder}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
  const { error } = await supabase.storage.from('images').upload(fileName, file)
  if (error) { console.error('Upload error:', error); return null }
  const { data } = supabase.storage.from('images').getPublicUrl(fileName)
  return data.publicUrl
}

export async function deleteImage(url: string): Promise<boolean> {
  const path = url.split('/images/')[1]
  if (!path) return false
  const { error } = await supabase.storage.from('images').remove([path])
  return !error
}
