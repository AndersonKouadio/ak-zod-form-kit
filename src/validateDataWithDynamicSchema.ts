import * as z from 'zod';
import { createDynamicZodSchema } from './createDynamicZodSchema'; // Assurez-vous que createDynamicZodSchema est importable

/**
 * Valide un objet de données en utilisant un schéma Zod dynamique.
 * Le schéma dynamique est construit à la volée en se basant sur la structure des `inputData`
 * et les définitions de votre `baseSchema`. Cela permet une validation flexible qui s'adapte
 * aux champs réellement présents dans les données tout en appliquant les règles de votre schéma de base.
 *
 * @template T Le type de la forme brute du schéma Zod de base.
 * @param {z.ZodObject<T>} baseSchema - Le schéma Zod de base qui contient les définitions de validation pour les champs connus.
 * @param {Record<string, unknown>} inputData - L'objet de données à valider.
 * @returns {z.ZodSafeParseResult<z.infer<z.ZodObject<T>>>}
 * Le résultat standard de `safeParse` de Zod, indiquant si la validation a réussi ou échoué,
 * et contenant les données validées ou les erreurs.
 *
 * @example
 * const ArticleSchema = z.object({
 * title: z.string().min(5),
 * content: z.string().optional(),
 * });
 * const articleData = { title: 'Mon Article', author: 'Jane Doe' }; // 'author' n'est pas dans ArticleSchema
 * const validationResult = validateDataWithDynamicSchema(ArticleSchema, articleData);
 * // validationResult.success sera true, et validationResult.data contiendra 'author' comme z.unknown()
 */
export function validateDataWithDynamicSchema<T extends z.ZodRawShape>(
  baseSchema: z.ZodObject<T>,
  data: Record<string, unknown>
): z.ZodSafeParseResult<Record<string, unknown>> {
  const dynamicSchema = createDynamicZodSchema(baseSchema, data); // Crée le schéma dynamique
  return dynamicSchema.safeParse(data); // Valide les données avec le schéma dynamique
}
