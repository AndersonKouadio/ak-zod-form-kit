import * as z from 'zod';

/**
 * Convertit les erreurs détaillées d'un résultat de validation Zod (`ZodError`) en un objet plat.
 * L'objet résultant mappe les chemins des champs erronés (par exemple, 'adresse.rue') à leurs messages d'erreur correspondants.
 *
 * @param {z.ZodSafeParseResult<any>} validationResult - L'objet retourné par `schema.safeParse()`.
 * @returns {{ [key: string]: string }} Un objet où les clés sont les chemins des champs (séparés par des points)
 * et les valeurs sont les messages d'erreur. Retourne un objet vide si la validation a réussi.
 *
 * @example
 * // Supposons `validationResult` est le résultat d'un `schema.safeParse()` échoué
 * const errors = formatZodErrorsAsObject(validationResult);
 * // errors pourrait être : { 'username': 'Nom d\'utilisateur trop court', 'email': 'Format d\'email invalide' }
 */
export const formatZodErrorsAsObject = (validationResult: z.ZodSafeParseResult<any>): Record<string, string> => {
  if (validationResult.success) return {};

  const errors: Record<string, string> = {};

  validationResult.error.issues.forEach((issue) => {
    const path = issue.path.join('.'); // Concatène le chemin du champ avec des points (ex: ['address', 'street'] -> 'address.street')

    errors[path] = issue.message;
  });

  return errors;
};


/**
 * Convertit les erreurs détaillées d'un résultat de validation Zod (`ZodError`) en un tableau d'objets.
 * Chaque objet du tableau contient la clé du champ (`key`) et son message d'erreur (`message`).
 * Ce format est souvent utile pour itérer et afficher les erreurs dans une interface utilisateur.
 *
 * @param {z.ZodSafeParseResult<any>} validationResult - L'objet retourné par `schema.safeParse()`.
 * @returns {{ key: string; message: string }[]} Un tableau d'erreurs. Retourne un tableau vide si la validation a réussi.
 *
 * @example
 * // Supposons `validationResult` est le résultat d'un `schema.safeParse()` échoué
 * const errors = formatZodErrorsAsArray(validationResult);
 * // errors pourrait être :
 * // [
 * //   { key: 'username', message: 'Nom d\'utilisateur trop court' },
 * //   { key: 'email', message: 'Format d\'email invalide' }
 * // ]
 */
export const formatZodErrorsAsArray = (validationResult: z.ZodSafeParseResult<any>): { key: string; message: string }[] => {
  if (validationResult.success) return [];

  const errors: { key: string; message: string }[] = [];

  validationResult.error.issues.forEach((issue) => {
    const path = issue.path.join('.'); // Concatène le chemin du champ avec des points

    errors.push({ key: path, message: issue.message });
  });

  return errors;
};