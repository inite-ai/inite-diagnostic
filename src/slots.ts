/**
 * The eight things a free diagnostic establishes.
 *
 * A copy, and it says so: the definition lives in the service, at
 * `src/lib/audit/slots.ts` in the inite.solutions repository, where three
 * readers already depend on it — the panel that draws the map, the interview
 * agent that picks what to ask next, and the summary that reaches a human.
 *
 * It is copied here rather than fetched because the tools below are the half
 * of this package that works with no account and no network. A list that has
 * to be downloaded before the first question is a list that fails on a plane.
 *
 * What keeps the copy honest is that the keys are load-bearing on the other
 * side: `answer_audit` names one of them, and the service builds the field
 * enum per call from its own list. A key renamed there and not here stops
 * being accepted, loudly, on the first remote call — which is the failure mode
 * worth having, rather than a silent drift in what gets asked.
 */

export interface Slot {
  key: string
  /** What the question is for, said plainly enough for an agent to ask it. */
  asks: string
  /** More than one answer can be true at once. */
  multiple?: boolean
}

export const SLOTS: Slot[] = [
  { key: 'industry', asks: 'What the business actually does, and for whom' },
  {
    key: 'channels',
    asks: 'Where enquiries arrive — WhatsApp, email, Instagram, the phone, a form',
    multiple: true,
  },
  {
    key: 'crm',
    asks: 'Where customer data is kept today, including "a spreadsheet" and "nowhere"',
  },
  { key: 'dailyInquiries', asks: 'How many enquiries arrive on an ordinary day, as a range' },
  { key: 'dailyLeads', asks: 'How many of those turn into qualified leads, as a range' },
  {
    key: 'teamSize',
    asks: 'How many people spend a meaningful part of their day on this work',
  },
  { key: 'painPoint', asks: 'Where the process breaks, or what it costs when it does' },
  { key: 'goal', asks: 'What they want to be true in ninety days' },
]

/** Stored when someone declines a question. Every question may be declined. */
export const SKIPPED = '__skip__'

export const SLOT_KEYS = SLOTS.map((slot) => slot.key)

/** Answered means answered — a decline is a decision, not a value. */
export function isAnswered(value: unknown): boolean {
  if (value === undefined || value === null || value === SKIPPED) return false
  return String(value).trim() !== ''
}
