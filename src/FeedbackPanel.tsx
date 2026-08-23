'use client'

import { useMutation } from '@tanstack/react-query'
import { useMemo, useState, type FormEvent } from 'react'
import { submitAppFeedback, type FeedbackProduct } from './feedbackApi'
import { FEEDBACK_QUESTIONS, type FeedbackQuestionKey } from './feedbackQuestions'
import { ApiError } from './http'
import { Panel } from './Panel'

const inputClass =
  'w-full rounded-2xl border border-[var(--border)] bg-[var(--input-bg)] px-3.5 py-2.5 outline-none focus:ring-2 focus:ring-[var(--accent)]'

export function FeedbackPanel({
  product,
  productName,
}: {
  product: FeedbackProduct
  productName: string
}) {
  const [answers, setAnswers] = useState<Partial<Record<FeedbackQuestionKey, string>>>({})
  const [comment, setComment] = useState('')
  const [message, setMessage] = useState<string | null>(null)

  const complete = useMemo(
    () => FEEDBACK_QUESTIONS.every((question) => Boolean(answers[question.key])),
    [answers],
  )

  const send = useMutation({
    mutationFn: () =>
      submitAppFeedback({
        product,
        answers: FEEDBACK_QUESTIONS.map((question) => ({
          key: question.key,
          choice: answers[question.key] ?? '',
        })),
        comment: comment.trim() || undefined,
      }),
    onSuccess: (response) => {
      setAnswers({})
      setComment('')
      setMessage(response.message)
    },
    onError: (error) => {
      setMessage(error instanceof ApiError ? error.message : 'No se pudo enviar el feedback.')
    },
  })

  function onSubmit(event: FormEvent) {
    event.preventDefault()
    setMessage(null)
    if (!complete) {
      return
    }
    send.mutate()
  }

  return (
    <Panel className="space-y-5 p-6">
      <div>
        <h2 className="text-lg font-semibold">Feedback</h2>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Encuesta breve sobre {productName}. El comentario es opcional.
        </p>
      </div>

      <form onSubmit={onSubmit} className="space-y-5">
        {FEEDBACK_QUESTIONS.map((question) => (
          <fieldset key={question.key} className="space-y-2">
            <legend className="text-sm font-medium text-[var(--text)]">
              {question.title(productName)}
            </legend>
            <div className="grid gap-2" role="radiogroup" aria-label={question.title(productName)}>
              {question.options.map((option) => {
                const selected = answers[question.key] === option.value
                return (
                  <button
                    key={option.value}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    onClick={() =>
                      setAnswers((current) => ({ ...current, [question.key]: option.value }))
                    }
                    className={[
                      'flex w-full items-center rounded-2xl border px-3.5 py-2.5 text-left text-sm transition',
                      selected
                        ? 'border-[var(--accent)] bg-[var(--accent-soft)] font-medium text-[var(--accent-strong)]'
                        : 'border-[var(--border)] bg-[var(--input-bg)] hover:border-[var(--accent)]',
                    ].join(' ')}
                  >
                    {option.label}
                  </button>
                )
              })}
            </div>
          </fieldset>
        ))}

        <label className="block space-y-1.5">
          <span className="text-sm font-medium text-[var(--muted)]">Comentario (opcional)</span>
          <textarea
            value={comment}
            onChange={(event) => setComment(event.target.value)}
            rows={4}
            maxLength={4000}
            placeholder="Si querés, contanos un detalle o una idea…"
            className={`${inputClass} resize-y`}
          />
        </label>

        <button
          type="submit"
          disabled={send.isPending || !complete}
          className="rounded-2xl bg-[var(--accent)] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
        >
          {send.isPending ? 'Enviando…' : 'Enviar feedback'}
        </button>
        {message && <p className="text-sm text-[var(--accent-strong)]">{message}</p>}
      </form>
    </Panel>
  )
}
