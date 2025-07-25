import { z } from 'zod';

/**
 * Construit un schéma Zod dynamique basé sur un schéma de base et la structure des données d'entrée.
 * Les champs présents dans les `inputData` qui existent également dans le `baseSchema` conservent leur validation d'origine.
 * Les champs présents dans `inputData` mais non définis dans le `baseSchema` sont acceptés comme `z.unknown()`.
 * Ceci est particulièrement utile pour valider des entrées où des champs supplémentaires non spécifiés par le schéma de base
 * peuvent être présents sans entraîner d'erreurs de validation inattendues.
 *
 * @template T Le type de la forme brute du schéma Zod de base (par exemple, `{ name: z.string(), age: z.number() }`).
 * @param {z.ZodObject<T>} baseSchema - Le schéma Zod de base qui définit les validations attendues pour les champs connus.
 * @param {Record<string, unknown>} inputData - L'objet de données qui sera validé. Sa structure dictera les champs
 * qui seront inclus dans le schéma dynamique.
 * @returns {z.ZodObject<any>} Un nouveau schéma Zod, ajusté dynamiquement pour correspondre aux champs de `inputData`.
 *
 * @example
 * const UserBaseSchema = z.object({
 *   username: z.string().min(3),
 *   email: z.string().email(),
 * });
 * const userData = { username: 'john_doe', email: 'john@example.com', extraField: 'someValue' };
 * const dynamicSchema = createDynamicZodSchema(UserBaseSchema, userData);
 * // dynamicSchema sera comme : z.object({ username: z.string(), email: z.string(), extraField: z.unknown() })
 * const result = dynamicSchema.safeParse(userData); // Validera sans erreur pour 'extraField'
 */
export function createDynamicZodSchema<T extends z.ZodRawShape>(
  baseSchema: z.ZodObject<T>,
  data: Record<string, unknown>
): z.ZodObject<any> {
  let dynamicSchema = z.object({});

  for (const key in data) {
    if (key in baseSchema.shape) {
      dynamicSchema = dynamicSchema.extend({
        [key]: baseSchema.shape[key],
      });
    } else {
      // Étend le schéma avec z.unknown() pour les champs non définis
      dynamicSchema = dynamicSchema.extend({
        [key]: z.unknown(),
      });
    }
  }

  return dynamicSchema;
}
