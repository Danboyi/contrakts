'use client'

import { useEffect, useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Camera, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { updateAvatar } from '@/lib/profile/actions'
import { createClient } from '@/lib/supabase/client'
import { Avatar } from '@/components/ui/avatar'
import { cn } from '@/lib/utils/cn'

interface AvatarUploadProps {
  userId: string
  name: string
  currentUrl: string | null
  size?: 'md' | 'lg'
}

function sanitizeFileName(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, '-')
}

export function AvatarUpload({
  userId,
  name,
  currentUrl,
  size = 'lg',
}: AvatarUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()
  const [preview, setPreview] = useState<string | null>(currentUrl)
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    setPreview(currentUrl)
  }, [currentUrl])

  async function handleFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) {
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Avatar must be under 5MB.')
      event.target.value = ''
      return
    }

    const reader = new FileReader()
    reader.onload = (loadEvent) => {
      setPreview((loadEvent.target?.result as string) ?? currentUrl)
    }
    reader.readAsDataURL(file)

    startTransition(async () => {
      const supabase = createClient()
      const extension = file.name.split('.').pop()?.toLowerCase() ?? 'png'
      const path = `${userId}/${Date.now()}_${sanitizeFileName(name)}.${extension}`

      const { data, error } = await supabase.storage.from('avatars').upload(path, file, {
        upsert: true,
        cacheControl: '3600',
      })

      if (error || !data) {
        toast.error(`Upload failed: ${error?.message ?? 'Unknown upload error.'}`)
        setPreview(currentUrl)
        event.target.value = ''
        return
      }

      const result = await updateAvatar(data.path)
      if (result.error) {
        toast.error(result.error)
        setPreview(currentUrl)
        event.target.value = ''
        return
      }

      toast.success('Avatar updated.')
      router.refresh()
      event.target.value = ''
    })
  }

  return (
    <div
      className="group relative inline-flex cursor-pointer"
      onClick={() => inputRef.current?.click()}
    >
      <Avatar name={name} src={preview} size={size === 'lg' ? 'xl' : 'lg'} />

      <div
        className={cn(
          'absolute inset-0 rounded-full',
          'flex items-center justify-center',
          'bg-black/50 opacity-0 transition-opacity duration-150',
          'group-hover:opacity-100'
        )}
      >
        {isPending ? (
          <Loader2 size={16} className="animate-spin text-white" />
        ) : (
          <Camera size={16} className="text-white" />
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={handleFile}
      />
    </div>
  )
}
