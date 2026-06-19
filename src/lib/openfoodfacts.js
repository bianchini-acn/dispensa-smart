export async function fetchProductByBarcode(barcode) {
  const clean = String(barcode).trim()
  const res = await fetch(`https://world.openfoodfacts.org/api/v0/product/${clean}.json`)
  const data = await res.json()
  if (data.status !== 1) return null
  const p = data.product
  return {
    barcode,
    name: p.product_name || p.product_name_it || '',
    brand: p.brands || '',
    image_url: p.image_front_url || p.image_url || null,
    ingredients: p.ingredients_text || p.ingredients_text_it || '',
    nutrients: {
      energy_kcal: p.nutriments?.['energy-kcal_100g'] ?? null,
      fat: p.nutriments?.fat_100g ?? null,
      saturated_fat: p.nutriments?.['saturated-fat_100g'] ?? null,
      carbohydrates: p.nutriments?.carbohydrates_100g ?? null,
      sugars: p.nutriments?.sugars_100g ?? null,
      fiber: p.nutriments?.fiber_100g ?? null,
      proteins: p.nutriments?.proteins_100g ?? null,
      salt: p.nutriments?.salt_100g ?? null,
    }
  }
}
