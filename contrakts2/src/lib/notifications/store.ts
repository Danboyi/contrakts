import { createAdminClient } from '@/lib/supabase/admin'
import type { Database } from '@/types/supabase'

type NotificationInsert = Database['public']['Tables']['notifications']['Insert']
type NotificationPreferenceRow =
  Database['public']['Tables']['notification_preferences']['Row']
type Channel = 'in_app' | 'email'

function preferenceKey(userId: string, notificationType: string) {
  return `${userId}:${notificationType}`
}

async function getPreferenceMap(userIds: string[], notificationTypes: string[]) {
  const supabaseAdmin = createAdminClient()
  const uniqueUserIds = [...new Set(userIds.filter(Boolean))]
  const uniqueTypes = [...new Set(notificationTypes.filter(Boolean))]

  if (uniqueUserIds.length === 0 || uniqueTypes.length === 0) {
    return new Map<string, NotificationPreferenceRow>()
  }

  const { data } = await supabaseAdmin
    .from('notification_preferences')
    .select('*')
    .in('user_id', uniqueUserIds)
    .in('notification_type', uniqueTypes)

  return new Map(
    (data ?? []).map((row) => [preferenceKey(row.user_id, row.notification_type), row])
  )
}

export async function isNotificationChannelEnabled(
  userId: string,
  notificationType: string,
  channel: Channel
) {
  const preferenceMap = await getPreferenceMap([userId], [notificationType])
  const preference = preferenceMap.get(preferenceKey(userId, notificationType))
  return preference ? preference[channel] : true
}

export async function insertNotifications(
  notifications: NotificationInsert | NotificationInsert[]
) {
  const supabaseAdmin = createAdminClient()
  const list = Array.isArray(notifications) ? notifications : [notifications]

  if (list.length === 0) {
    return
  }

  const preferenceMap = await getPreferenceMap(
    list.map((item) => item.user_id),
    list.map((item) => item.type)
  )

  const deliverable = list.filter((item) => {
    const preference = preferenceMap.get(preferenceKey(item.user_id, item.type))
    return preference ? preference.in_app : true
  })

  if (deliverable.length === 0) {
    return
  }

  await supabaseAdmin.from('notifications').insert(deliverable)
}
