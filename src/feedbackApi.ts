import { getBusinessHttp } from './http'
import type { FeedbackQuestionKey } from './feedbackQuestions'

export type FeedbackProduct = 'ads' | 'mailer' | 'shop' | 'assistant' | 'projects' | 'affiliates' | 'estimator'

export type FeedbackAnswer = {
  key: FeedbackQuestionKey
  choice: string
}

export async function submitAppFeedback(payload: {
  product: FeedbackProduct
  answers: FeedbackAnswer[]
  comment?: string
}): Promise<{ success: boolean; message: string }> {
  return getBusinessHttp().request('/feedback', {
    method: 'POST',
    body: payload,
  })
}
