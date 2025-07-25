import { FormDataExtractionOptions } from './types';

/**
 * Extrait et organise les données à partir d'objet `FormData` ou d'un `Record<string, unknown>` standard.
 * Cette fonction est flexible, permettant des transformations de clés, l'inclusion ou l'exclusion de champs,
 * et la gestion appropriée des champs `FormData` qui peuvent contenir plusieurs valeurs (par exemple, des fichiers multiples ou des sélections multiples).
 *
 * @param {FormData | Record<string, unknown>} inputData - L'objet de données source à partir duquel extraire.
 * Il peut s'agir d'un `FormData` (directement d'un événement de formulaire) ou d'un objet JavaScript.
 * @param {FormDataExtractionOptions} [options={}] - Un objet d'options pour personnaliser le processus d'extraction.
 * - `keyTransforms`: Mappe les noms de champs originaux vers de nouveaux noms.
 * - `excludeFields`: Liste les noms de champs à ignorer.
 * - `includeFields`: Liste les noms de champs à inclure exclusivement (si non vides).
 * @returns {Record<string, unknown>} Un nouvel objet JavaScript contenant les données extraites et potentiellement remaniées.
 *
 * @example
 * // Utilisation avec FormData d'un événement de formulaire
 * const myFormData = new FormData(document.querySelector('form'));
 * const extracted = extractDataFromFormData(myFormData, {
 * keyTransforms: { 'user_email': 'email' },
 * excludeFields: ['_csrf']
 * });
 * console.log(extracted); // { name: 'John Doe', email: 'john@example.com' }
 *
 * @example
 * // Utilisation avec un objet JavaScript
 * const myObject = { firstName: 'Jane', age: 30, password: 'abc' };
 * const extractedObject = extractDataFromFormData(myObject, {
 * includeFields: ['firstName', 'age']
 * });
 * console.log(extractedObject); // { firstName: 'Jane', age: 30 }
 */
export function extractDataFromFormData(
  data: FormData | Record<string, unknown>,
  options: FormDataExtractionOptions = {}
): Record<string, unknown> {
  const { keyTransforms = {}, excludeFields = [], includeFields } = options;
  const result: Record<string, unknown> = {};

  const shouldProcessKey = (key: string): boolean => {
    if (excludeFields.includes(key)) return false;
    if (includeFields && !includeFields.includes(key)) return false;
    return true;
  };

  const transformKey = (key: string): string => {
    return keyTransforms[key] || key;
  };

  if (data instanceof FormData) {
    const processedKeys = new Set<string>();

    data.forEach((value, key) => {
      if (!shouldProcessKey(key)) return;

      const transformedKey = transformKey(key);

      if (!processedKeys.has(key)) {
        const allValues = data.getAll(key);
        result[transformedKey] =
          allValues.length > 1 ? allValues : allValues[0];
        processedKeys.add(key);
      }
    });
  } else {
    Object.entries(data).forEach(([key, value]) => {
      if (!shouldProcessKey(key)) return;

      const transformedKey = transformKey(key);
      result[transformedKey] = value;
    });
  }

  return result;
}
