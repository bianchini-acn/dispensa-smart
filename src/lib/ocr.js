import { createWorker } from 'tesseract.js'

export async function extractNutrientsFromImage(imageFile, onProgress) {
  const worker = await createWorker('ita+eng', 1, {
    logger: m => { if (m.status === 'recognizing text') onProgress?.(Math.round(m.progress * 100)) }
  })
  const { data: { text } } = await worker.recognize(imageFile)
  await worker.terminate()
  return parseNutrients(text)
}

function findValue(text, patterns) {
  for (const pattern of patterns) {
    const match = text.match(pattern)
    if (match) {
      const val = parseFloat(match[1].replace(',', '.'))
      if (!isNaN(val)) return val
    }
  }
  return null
}

function parseNutrients(text) {
  const t = text.toLowerCase()
  return {
    energy_kcal: findValue(t, [
      /energia[\s\S]{0,30}?(\d+[\.,]\d*|\d+)\s*kcal/,
      /(\d+[\.,]\d*|\d+)\s*kcal/,
      /calorie[\s\S]{0,20}?(\d+[\.,]\d*|\d+)/,
    ]),
    fat: findValue(t, [
      /grass[oi][\s\S]{0,20}?(\d+[\.,]\d*|\d+)\s*g/,
      /lipid[\s\S]{0,20}?(\d+[\.,]\d*|\d+)\s*g/,
      /fat[\s\S]{0,20}?(\d+[\.,]\d*|\d+)\s*g/,
    ]),
    saturated_fat: findValue(t, [
      /satur[\s\S]{0,30}?(\d+[\.,]\d*|\d+)\s*g/,
      /acidi grassi saturi[\s\S]{0,20}?(\d+[\.,]\d*|\d+)\s*g/,
    ]),
    carbohydrates: findValue(t, [
      /carboidrat[\s\S]{0,20}?(\d+[\.,]\d*|\d+)\s*g/,
      /carbohydrate[\s\S]{0,20}?(\d+[\.,]\d*|\d+)\s*g/,
    ]),
    sugars: findValue(t, [
      /zuccher[\s\S]{0,20}?(\d+[\.,]\d*|\d+)\s*g/,
      /sugar[\s\S]{0,20}?(\d+[\.,]\d*|\d+)\s*g/,
      /di cui zuccheri[\s\S]{0,20}?(\d+[\.,]\d*|\d+)\s*g/,
    ]),
    fiber: findValue(t, [
      /fibr[\s\S]{0,20}?(\d+[\.,]\d*|\d+)\s*g/,
      /fibre[\s\S]{0,20}?(\d+[\.,]\d*|\d+)\s*g/,
    ]),
    proteins: findValue(t, [
      /protei[\s\S]{0,20}?(\d+[\.,]\d*|\d+)\s*g/,
      /protein[\s\S]{0,20}?(\d+[\.,]\d*|\d+)\s*g/,
    ]),
    salt: findValue(t, [
      /sale[\s\S]{0,20}?(\d+[\.,]\d*|\d+)\s*g/,
      /sodio[\s\S]{0,20}?(\d+[\.,]\d*|\d+)\s*(?:mg|g)/,
      /salt[\s\S]{0,20}?(\d+[\.,]\d*|\d+)\s*g/,
    ]),
  }
}
