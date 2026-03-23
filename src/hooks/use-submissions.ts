'use client'

import { useCallback, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { isSupabaseConfigured } from '@/lib/supabase/config'
import type { Deliverable, Submission, SubmissionReview } from '@/types'

type SubmissionUser = NonNullable<Submission['submitter']>

function normalizeSubmissions(rows: Submission[]) {
  return rows.map((submission) => ({
    ...submission,
    deliverables: [...(submission.deliverables ?? [])].sort(
      (left, right) => left.sort_order - right.sort_order
    ),
    reviews: [...(submission.reviews ?? [])].sort(
      (left, right) =>
        new Date(right.created_at).getTime() - new Date(left.created_at).getTime()
    ),
  }))
}

export function useSubmissions(milestoneId: string) {
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchSubmissions = useCallback(async () => {
    if (!isSupabaseConfigured() || !milestoneId) {
      setSubmissions([])
      setLoading(false)
      return
    }

    const supabase = createClient()
    const { data: submissionRows, error: fetchError } = await supabase
      .from('submissions')
      .select('*')
      .eq('milestone_id', milestoneId)
      .order('version', { ascending: false })

    if (fetchError) {
      setError(fetchError.message)
      setLoading(false)
      return
    }

    const submissionIds = (submissionRows ?? []).map((submission) => submission.id)
    const userIds = new Set<string>()

    for (const submission of submissionRows ?? []) {
      if (submission.submitted_by) {
        userIds.add(submission.submitted_by)
      }
    }

    const [deliverablesResult, reviewsResult] = await Promise.all([
      submissionIds.length > 0
        ? supabase
            .from('deliverables')
            .select(
              'id, milestone_id, submitted_by, file_url, file_name, file_type, note, created_at, submission_id, sort_order'
            )
            .in('submission_id', submissionIds)
            .order('sort_order', { ascending: true })
        : Promise.resolve({ data: [], error: null }),
      submissionIds.length > 0
        ? supabase
            .from('submission_reviews')
            .select('*')
            .in('submission_id', submissionIds)
            .order('created_at', { ascending: false })
        : Promise.resolve({ data: [], error: null }),
    ])

    if (deliverablesResult.error) {
      setError(deliverablesResult.error.message)
      setLoading(false)
      return
    }

    if (reviewsResult.error) {
      setError(reviewsResult.error.message)
      setLoading(false)
      return
    }

    for (const review of reviewsResult.data ?? []) {
      if (review.reviewer_id) {
        userIds.add(review.reviewer_id)
      }
    }

    const { data: users } =
      userIds.size > 0
        ? await supabase
            .from('users')
            .select('id, full_name, email, avatar_url')
            .in('id', [...userIds])
        : { data: [] as SubmissionUser[] }

    const usersById = new Map((users ?? []).map((user) => [user.id, user]))
    const deliverablesBySubmission = new Map<string, Deliverable[]>()
    const reviewsBySubmission = new Map<string, SubmissionReview[]>()

    for (const deliverable of (deliverablesResult.data ?? []) as Deliverable[]) {
      if (!deliverable.submission_id) {
        continue
      }

      const current = deliverablesBySubmission.get(deliverable.submission_id) ?? []
      current.push(deliverable)
      deliverablesBySubmission.set(deliverable.submission_id, current)
    }

    for (const review of (reviewsResult.data ?? []) as Array<
      SubmissionReview & { reviewer_id: string }
    >) {
      const current = reviewsBySubmission.get(review.submission_id) ?? []
      current.push({
        ...review,
        reviewer: usersById.get(review.reviewer_id) ?? undefined,
      })
      reviewsBySubmission.set(review.submission_id, current)
    }

    const normalizedRows = (submissionRows ?? []).map((submission) => ({
      ...submission,
      submitter: usersById.get(submission.submitted_by) ?? undefined,
      deliverables: deliverablesBySubmission.get(submission.id) ?? [],
      reviews: reviewsBySubmission.get(submission.id) ?? [],
    }))

    setSubmissions(normalizeSubmissions(normalizedRows as unknown as Submission[]))
    setError(null)
    setLoading(false)
  }, [milestoneId])

  useEffect(() => {
    void fetchSubmissions()
  }, [fetchSubmissions])

  useEffect(() => {
    if (!isSupabaseConfigured() || !milestoneId) {
      return
    }

    const supabase = createClient()
    const channel = supabase
      .channel(`submissions:${milestoneId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'submissions',
          filter: `milestone_id=eq.${milestoneId}`,
        },
        () => {
          void fetchSubmissions()
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'deliverables',
          filter: `milestone_id=eq.${milestoneId}`,
        },
        () => {
          void fetchSubmissions()
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'submission_reviews',
        },
        () => {
          void fetchSubmissions()
        }
      )
      .subscribe()

    return () => {
      void supabase.removeChannel(channel)
    }
  }, [fetchSubmissions, milestoneId])

  const latestSubmission = submissions[0] ?? null
  const currentVersion = latestSubmission?.version ?? 0
  const canSubmitNew =
    !latestSubmission ||
    latestSubmission.state === 'revision_requested' ||
    latestSubmission.state === 'rejected'

  return {
    submissions,
    latestSubmission,
    currentVersion,
    canSubmitNew,
    loading,
    error,
    refetch: fetchSubmissions,
  }
}
