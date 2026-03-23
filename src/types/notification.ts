export interface Notification {
  id: string
  user_id: string
  contract_id: string | null
  type: string
  title: string
  body: string
  read: boolean
  created_at: string
}

export interface NotificationPreference {
  id: string
  user_id: string
  notification_type: string
  in_app: boolean
  email: boolean
  created_at: string
  updated_at: string
}
