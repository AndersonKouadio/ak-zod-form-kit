/**
 * Applique un ensemble de fonctions de transformation à des champs spécifiques d'un objet de données.
 * Utile pour normaliser, formater ou convertir des valeurs de champs avant leur utilisation ou validation.
 * Notez que pour les transformations de type de base (string vers number/boolean/Date), l'utilisation
 * des méthodes `.transform()` ou `.coerce` de Zod directement dans votre schéma est souvent préférable.
 * Cette fonction est utile pour des transformations plus complexes ou dépendantes du contexte.
 *
 * @param {Record<string, unknown>} data - L'objet de données source sur lequel appliquer les transformations.
 * @param {Record<string, (value: unknown) => unknown>} transformations - Un objet de fonctions de transformation.
 * Chaque clé doit correspondre au nom d'un champ dans `data`, et sa valeur est une fonction qui prend la valeur
 * actuelle de ce champ et retourne sa nouvelle valeur transformée.
 * @returns {Record<string, unknown>} Un nouvel objet contenant les données avec les transformations appliquées.
 * L'objet original n'est pas muté.
 *
 * @example
 * const rawData = { price: '123.45', isActive: 'true', tags: 'tag1,tag2' };
 * const transformed = applyDataTransformations(rawData, {
 * price: (value) => parseFloat(String(value)),
 * isActive: (value) => String(value) === 'true',
 * tags: (value) => String(value).split(','),
 * });
 * // transformed sera : { price: 123.45, isActive: true, tags: ['tag1', 'tag2'] }
 */
export function applyDataTransformations(
  data: Record<string, unknown>,
  transformations: Record<string, (value: unknown) => unknown>
): Record<string, unknown> {
  const transformedData: Record<string, unknown> = { ...data }; // Crée une copie superficielle pour ne pas modifier l'original

  for (const [key, transform] of Object.entries(transformations)) {
    if (key in data) {
      // Applique la transformation seulement si le champ existe dans les données
      transformedData[key] = transform(data[key]);
    }
  }

  return transformedData;
}
