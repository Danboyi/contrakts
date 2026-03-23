export type MessageType =
  | 'user'
  | 'system'
  | 'file'
  | 'submission'
  | 'feedback'

export interface Message {
  id: string
  contract_id: string
  sender_id: string
  body: string
  attachment_url: string | null
  attachment_name: string | null
  attachment_type: string | null
  attachment_size: number | null
  message_type: MessageType
  milestone_id: string | null
  deliverable_id: string | null
  read_by_recipient: boolean
  read_at: string | null
  deleted_at: string | null
  created_at: string
  sender?: {
    id: string
    full_name: string
    email: string
    avatar_url: string | null
  }
}
