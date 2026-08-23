export type FeedbackQuestionKey = 'satisfaction' | 'ease' | 'value'

export type FeedbackQuestion = {
  key: FeedbackQuestionKey
  title: (productName: string) => string
  options: Array<{ value: string; label: string }>
}

export const FEEDBACK_QUESTIONS: FeedbackQuestion[] = [
  {
    key: 'satisfaction',
    title: (productName) => `¿Cómo calificarías tu experiencia con ${productName}?`,
    options: [
      { value: 'very_satisfied', label: 'Muy satisfactoria' },
      { value: 'satisfied', label: 'Satisfactoria' },
      { value: 'neutral', label: 'Neutral' },
      { value: 'dissatisfied', label: 'Insatisfactoria' },
      { value: 'very_dissatisfied', label: 'Muy insatisfactoria' },
    ],
  },
  {
    key: 'ease',
    title: (productName) => `¿Qué tan fácil te resulta usar ${productName}?`,
    options: [
      { value: 'very_easy', label: 'Muy fácil' },
      { value: 'easy', label: 'Fácil' },
      { value: 'acceptable', label: 'Aceptable' },
      { value: 'hard', label: 'Difícil' },
      { value: 'very_hard', label: 'Muy difícil' },
    ],
  },
  {
    key: 'value',
    title: (productName) => `¿Cuánto te resuelve ${productName} hoy?`,
    options: [
      { value: 'a_lot', label: 'Mucho' },
      { value: 'quite_a_bit', label: 'Bastante' },
      { value: 'somewhat', label: 'Algo' },
      { value: 'little', label: 'Poco' },
      { value: 'nothing', label: 'Nada' },
    ],
  },
]
