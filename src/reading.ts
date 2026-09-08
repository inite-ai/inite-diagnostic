/**
 * What the answers say on their own, before anybody reasons about them.
 *
 * This is arithmetic and nothing else: enquiries divided by people, leads
 * divided by enquiries, channels counted, blanks named. It runs on the machine
 * that installed this package — no model, no account, no call home — and it is
 * deliberately short of a conclusion.
 *
 * The restraint is the point. Every number here can be checked against the
 * answer it came from, and every assumption it had to make is printed beside
 * the result: "50-100" becomes 75 and says so. The moment this file starts
 * deciding that four channels and a spreadsheet mean somebody has a problem,
 * it is guessing in four languages off free text — and a confident wrong
 * finding is worse than a gap the audit can name.
 *
 * Drawing the conclusion is the caller's job, and the caller is a model. What
 * it needs is the arithmetic done exactly and the assumptions stated, which is
 * the one thing a language model is genuinely bad at doing in its head.
 */

import { SLOTS, SKIPPED, isAnswered } from './slots.js'

export interface Quantity {
  /** The number to compute with. */
  value: number
  /** How it was read, when the answer was not simply a number. */
  note?: string
}

/**
 * A number out of an answer somebody typed.
 *
 * Answers arrive as "50-100 a day", "under 10", "about 80", "2 people",
 * "10–50" with an en dash, and in four languages. Digits survive translation,
 * so the parse works on those and on the shape they are in, never on words.
 *
 * A range becomes its midpoint and says so. A single number is taken as given.
 * Anything with no digits in it returns null rather than a guess — an answer
 * like "hard to say" is a real answer and it is not a quantity.
 */
export function quantity(raw: unknown): Quantity | null {
  if (!isAnswered(raw)) return null
  const text = String(raw)

  // Any decimal comma is a thousands separator far more often than a decimal
  // point in this data ("1,200 a day"), so digits are read as whole numbers.
  const numbers = (text.match(/\d[\d\s]*/g) ?? [])
    .map((chunk) => Number(chunk.replace(/\s/g, '')))
    .filter((n) => Number.isFinite(n))

  if (numbers.length === 0) return null
  if (numbers.length === 1) return { value: numbers[0] }

  const low = Math.min(...numbers)
  const high = Math.max(...numbers)
  const mid = Math.round((low + high) / 2)
  return { value: mid, note: `read ${low}-${high} as ${mid}` }
}

/** One item per comma or slash. "WhatsApp, email / phone" is three. */
export function countChannels(raw: unknown): number | null {
  if (!isAnswered(raw)) return null
  const parts = String(raw)
    // Whitespace around the conjunction rather than \b: word boundaries in
    // JavaScript are defined on ASCII, so \bи\b can never match — a Cyrillic
    // letter is a non-word character on both sides of itself.
    .split(/[,;/]|\s+(?:and|y|e|и)\s+/i)
    .map((part) => part.trim())
    .filter(Boolean)
  return parts.length || null
}

export interface Reading {
  /** One line each, in the order they are worth reading. */
  lines: string[]
  /** Slot keys with no answer at all. */
  blank: string[]
  /** Slot keys the visitor declined. */
  declined: string[]
}

function round(n: number): string {
  return n >= 10 ? String(Math.round(n)) : n.toFixed(1).replace(/\.0$/, '')
}

export function readAnswers(answers: Record<string, unknown>): Reading {
  const lines: string[] = []

  const inquiries = quantity(answers.dailyInquiries)
  const leads = quantity(answers.dailyLeads)
  const people = quantity(answers.teamSize)

  if (inquiries && people && people.value > 0) {
    const each = inquiries.value / people.value
    const notes = [inquiries.note, people.note].filter(Boolean).join('; ')
    lines.push(
      `${inquiries.value} enquiries a day across ${people.value} ${
        people.value === 1 ? 'person' : 'people'
      } — ${round(each)} each${notes ? ` (${notes})` : ''}.`
    )
  } else if (inquiries) {
    lines.push(
      `${inquiries.value} enquiries a day${inquiries.note ? ` (${inquiries.note})` : ''}. How many people handle them is not answered, so the load per person is unknown.`
    )
  }

  if (inquiries && leads && inquiries.value > 0) {
    const share = (leads.value / inquiries.value) * 100
    const notes = [leads.note].filter(Boolean).join('; ')
    lines.push(
      `${leads.value} of them become leads — ${round(share)}% of what arrives${
        notes ? ` (${notes})` : ''
      }.`
    )
    if (leads.value > inquiries.value) {
      lines.push(
        `Those two do not sit together: more leads than enquiries. One of the answers means something other than what it was asked.`
      )
    }
  }

  const channels = countChannels(answers.channels)
  if (channels) {
    const record = isAnswered(answers.crm)
      ? `The record of them: ${String(answers.crm)}.`
      : `Where they are recorded is not answered.`
    lines.push(
      `${channels} ${channels === 1 ? 'channel' : 'channels'} enquiries arrive on. ${record}`
    )
  }

  const blank = SLOTS.filter((slot) => !(slot.key in answers)).map((slot) => slot.key)
  const declined = SLOTS.filter((slot) => answers[slot.key] === SKIPPED).map((slot) => slot.key)

  return { lines, blank, declined }
}

/**
 * The reading as text, with the one honest sentence about what it is not.
 *
 * Local arithmetic cannot say what to automate first: that reads eight answers
 * against each other and against what the same answers looked like for
 * somebody else. Saying so here, next to the numbers, is what makes the offer
 * below an offer rather than an interruption.
 */
export function formatReading(answers: Record<string, unknown>, signedIn: boolean): string {
  const { lines, blank, declined } = readAnswers(answers)
  const out: string[] = []

  if (lines.length === 0) {
    out.push('Nothing here can be counted yet.')
  } else {
    out.push('From what you have been told:', ...lines.map((line) => `  ${line}`))
  }

  if (declined.length > 0) out.push('', `Declined: ${declined.join(', ')}.`)
  if (blank.length > 0) out.push('', `Not asked yet: ${blank.join(', ')}.`)

  out.push(
    '',
    'That is the arithmetic. What it cannot do is say what to automate first —',
    'that reads the answers against each other, and against what the same answers',
    'looked like for somebody else.'
  )

  if (!signedIn) {
    out.push(
      '',
      'The full reading, the saved audit you can come back to, and the forty-three',
      'question version across strategy, marketing, operations, finance and',
      'technology:',
      '',
      '  npx @inite/diagnostic login',
      '',
      'Free in the browser too, at https://inite.solutions/en/audit'
    )
  }

  return out.join('\n')
}
