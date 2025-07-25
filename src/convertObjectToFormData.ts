/**
 * Convertit un objet JavaScript standard en un objet `FormData` pour l'envoi via des requêtes HTTP
 * (par exemple, `fetch` ou `XMLHttpRequest`). Cette fonction gère intelligemment différents types de données,
 * y compris les primitifs, les `File`s, les `Blob`s, les `Date`s, les tableaux et les objets imbriqués,
 * en les sérialisant correctement pour le format `multipart/form-data`.
 *
 * @param {Record<string, unknown>} inputObject - L'objet JavaScript à convertir.
 * @returns {FormData} L'objet `FormData` résultant, prêt pour l'envoi.
 *
 * @example
 * const userData = {
 * name: 'Alice',
 * age: 28,
 * preferences: {
 * newsletter: true,
 * themes: ['dark', 'light']
 * },
 * avatar: new File(['content'], 'avatar.png', { type: 'image/png' }),
 * registrationDate: new Date(),
 * emptyField: null
 * };
 * const formDataToSend = convertObjectToFormData(userData);
 * // formDataToSend contiendra des entrées comme :
 * // 'name': 'Alice'
 * // 'age': '28'
 * // 'preferences[newsletter]': 'true'
 * // 'preferences[themes]': 'dark'
 * // 'preferences[themes]': 'light'
 * // 'avatar': (File object)
 * // 'registrationDate': (ISO string de la date)
 * // 'emptyField': ''
 */
export function convertObjectToFormData(
  inputObject: Record<string, unknown>
): FormData {
  const sendFormData = new FormData();

  /**
   * Fonction récursive helper pour ajouter des paires clé-valeur au FormData.
   * Gère la sérialisation de types complexes.
   * @param {string} key - La clé du champ (peut inclure la notation crochets pour les imbrications).
   * @param {unknown} value - La valeur du champ à ajouter.
   */
  function appendDataRecursively(key: string, value: unknown) {
    // Cas null ou undefined : append comme chaîne vide
    if (value === null || value === undefined) {
      sendFormData.append(key, '');
      return;
    }

    // Cas File : append directement avec le nom
    if (value instanceof File) {
      sendFormData.append(key, value, value.name);
      return;
    }

    // Cas Blob : append directement
    if (value instanceof Blob) {
      sendFormData.append(key, value);
      return;
    }

    // Cas Date : convertit en chaîne ISO 8601
    if (value instanceof Date) {
      sendFormData.append(key, value.toISOString());
      return;
    }

    // Cas tableau : itère sur les éléments
    if (Array.isArray(value)) {
      value.forEach((item, index) => {
        // Pour les éléments complexes (tableaux ou objets) dans un tableau, récursivité avec index
        if (Array.isArray(item) || isPlainObject(item)) {
          appendDataRecursively(`${key}[${index}]`, item);
        } else {
          // Les éléments primitifs sont ajoutés avec la même clé pour gérer les listes de valeurs
          sendFormData.append(key, String(item));
        }
      });
      return;
    }

    // Cas objet simple (non-null, non-File/Blob/Date/Array) : récursivité pour chaque propriété
    if (isPlainObject(value)) {
      Object.entries(value).forEach(([propertyKey, propertyValue]) => {
        appendDataRecursively(`${key}[${propertyKey}]`, propertyValue);
      });
      return;
    }

    // Cas des types primitifs (string, number, boolean) : convertit en string
    sendFormData.append(key, String(value));
  }

  /**
   * Fonction utilitaire pour vérifier si une valeur est un objet simple (non null, non tableau, non instance de types spécifiques).
   * @param {unknown} value - La valeur à vérifier.
   * @returns {value is Record<string, unknown>} Vrai si la valeur est un objet JavaScript simple, Faux sinon.
   */
  function isPlainObject(value: unknown): value is Record<string, unknown> {
    return (
      typeof value === 'object' &&
      value !== null &&
      value.constructor === Object
    );
  }
  // Lance le processus d'ajout pour chaque entrée de l'objet initial
  Object.entries(inputObject).forEach(([key, value]) => {
    appendDataRecursively(key, value);
  });

  return sendFormData;
}
