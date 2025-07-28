import * as z from 'zod';
// Assurez-vous que createDynamicZodSchema et les types sont importables
import { createDynamicZodSchema } from './createDynamicZodSchema';
import { SchemaModification, ValidationStrategy } from './types';

/**
 * Valide un objet de données en utilisant un schéma Zod dynamique.
 * Le schéma dynamique est construit à la volée en se basant sur la structure des `inputData`
 * et les définitions de votre `baseSchema`. Cela permet une validation flexible qui s'adapte
 * aux champs réellement présents dans les données tout en appliquant les règles de votre schéma de base.
 *
 * @template T Le type de la forme brute du schéma Zod de base.
 * @param {z.ZodObject<T>} baseSchema - Le schéma Zod de base qui contient les définitions de validation pour les champs connus.
 * @param {Record<string, unknown>} data - L'objet de données à valider.
 * @param {ValidationStrategy} [validationStrategy="strict"] - La stratégie de validation à appliquer (par défaut: "strict").
 * @param {SchemaModification} [schemaModification="default"] - La modification structurelle à appliquer au schéma (par défaut: "default").
 * @param {z.ZodTypeAny[]} [additionalSchemas=[]] - Un tableau de schémas Zod supplémentaires pour la fusion ou l'union (optionnel).
 * @returns {z.ZodSafeParseResult<z.infer<ReturnType<typeof createDynamicZodSchema<T>>>>}
 * Le résultat standard de `safeParse` de Zod. Le type `z.infer<ReturnType<typeof createDynamicZodSchema<T>>>`
 * garantit que le type des données validées est correctement inféré par le schéma dynamique créé,
 * y compris les champs supplémentaires potentiellement ajoutés ou les modifications structurelles.
 *
 * @example
 * // Définition d'un schéma de base pour un article
 * const ArticleSchema = z.object({
 * title: z.string().min(5),
 * content: z.string().optional(),
 * createdAt: z.string().datetime().optional(),
 * });
 *
 * // --- Exemples d'utilisation ---
 *
 * // 1. Cas de base : validation stricte (comportement par défaut)
 * console.log("--- Cas 1: Validation stricte ---");
 * const articleData1 = { title: 'Mon Super Article', extraField: 'une valeur indésirable' };
 * const result1 = validateDataWithDynamicSchema(ArticleSchema, articleData1);
 * if (!result1.success) {
 * console.log("Validation échouée (attendu) :", result1.error.errors);
 * }
 * // Output: Validation échouée [...] 'extraField' n'est pas permis.
 *
 * // 2. Cas avec autorisation de champs supplémentaires ("allowExtraFields")
 * console.log("\n--- Cas 2: Autoriser les champs supplémentaires ---");
 * const articleData2 = { title: 'Titre avec auteur', author: 'Jane Doe', views: 100 };
 * const result2 = validateDataWithDynamicSchema(ArticleSchema, articleData2, "allowExtraFields");
 * if (result2.success) {
 * console.log("Validation réussie :", result2.data);
 * // Output: { title: 'Titre avec auteur', author: 'Jane Doe', views: 100 }
 * // Note: 'author' et 'views' sont typés comme unknown si non définis dans ArticleSchema.
 * }
 *
 * // 3. Cas avec suppression des champs supplémentaires ("removeExtraFields")
 * console.log("\n--- Cas 3: Suppression des champs supplémentaires ---");
 * const articleData3 = { title: 'Article propre', category: 'Tech', tags: ['zod', 'typescript'] };
 * const result3 = validateDataWithDynamicSchema(ArticleSchema, articleData3, "removeExtraFields");
 * if (result3.success) {
 * console.log("Validation réussie (champs nettoyés) :", result3.data);
 * // Output: { title: 'Article propre' } - 'category' et 'tags' ont été supprimés
 * }
 *
 * // 4. Cas avec rendu partiel et strict ("partial-strict")
 * console.log("\n--- Cas 4: Partiel et Strict ---");
 * // Permet de valider une partie de l'article, mais rejette les champs non déclarés.
 * const partialArticleData = { title: 'Mise à jour partielle' }; // 'content' est optionnel
 * const result4 = validateDataWithDynamicSchema(ArticleSchema, partialArticleData, "partial-strict");
 * if (result4.success) {
 * console.log("Validation partielle réussie :", result4.data);
 * }
 * const invalidPartialData = { title: 'Mise à jour', version: 2 }; // 'version' n'est pas permis
 * const result4_2 = validateDataWithDynamicSchema(ArticleSchema, invalidPartialData, "partial-strict");
 * if (!result4_2.success) {
 * console.log("Validation partielle échouée (attendu) :", result4_2.error.errors);
 * }
 *
 * // 5. Cas de fusion avec logique ET ("mergeWithAnd")
 * console.log("\n--- Cas 5: Fusion (ET) ---");
 * const AuthorSchema = z.object({ author: z.string(), email: z.string().email().optional() });
 * const FullArticleSchema = z.object({ published: z.boolean().default(false) });
 * const articleData5 = { title: 'Article complet', content: '...', author: 'Alice', published: true };
 *
 * const result5 = validateDataWithDynamicSchema(
 * ArticleSchema,
 * articleData5,
 * "strict", // La stratégie s'applique au schéma fusionné
 * "mergeWithAnd",
 * [AuthorSchema, FullArticleSchema] // Schémas supplémentaires à fusionner
 * );
 * if (result5.success) {
 * console.log("Validation fusion (ET) réussie :", result5.data);
 * // Output: { title: 'Article complet', content: '...', author: 'Alice', published: true }
 * } else {
 * console.log("Validation fusion (ET) échouée :", result5.error.errors);
 * }
 *
 * // 6. Cas de fusion avec logique OU ("mergeWithOr")
 * console.log("\n--- Cas 6: Union (OU) ---");
 * const VideoSchema = z.object({ videoUrl: z.string().url(), duration: z.number().positive() });
 * const TextSchema = z.object({ textContent: z.string().min(100) });
 * // Note: Pour cet exemple, le baseSchema pourrait être un objet vide si l'intention est de valider
 * // soit une vidéo, soit un texte. Ou, il pourrait être l'un des types de l'union.
 *
 * const unionResult1 = validateDataWithDynamicSchema(
 * z.object({}), // Un schéma de base vide ou peu pertinent si l'union définit tout
 * { videoUrl: 'https://example.com/video.mp4', duration: 120 },
 * "strict",
 * "mergeWithOr",
 * [VideoSchema, TextSchema]
 * );
 * if (unionResult1.success) {
 * console.log("Validation Union (OU) réussie (Vidéo) :", unionResult1.data);
 * }
 *
 * const unionResult2 = validateDataWithDynamicSchema(
 * z.object({}),
 * { textContent: 'Ceci est un très long texte qui sera validé par le schéma de texte.', language: 'fr' },
 * "allowExtraFields", // Permet à 'language' de passer pour la démo
 * "mergeWithOr",
 * [VideoSchema, TextSchema]
 * );
 * if (unionResult2.success) {
 * console.log("Validation Union (OU) réussie (Texte) :", unionResult2.data);
 * } else {
 * console.log("Validation Union (OU) échouée (attendu pour certains cas) :", unionResult2.error.errors);
 * }
 */
export function validateDataWithDynamicSchema<T extends z.ZodRawShape>(
  baseSchema: z.ZodObject<T>,
  data: Record<string, unknown>,
  validationStrategy: ValidationStrategy = 'strict', // Ajout du paramètre
  schemaModification: SchemaModification = 'default', // Ajout du paramètre
  additionalSchemas: z.ZodTypeAny[] = [] // Ajout du paramètre
): z.ZodSafeParseResult<z.infer<ReturnType<typeof createDynamicZodSchema<T>>>> {
  const dynamicSchema = createDynamicZodSchema(
    baseSchema,
    data,
    validationStrategy,
    schemaModification,
    additionalSchemas
  ); // Passe tous les paramètres à createDynamicZodSchema
  return dynamicSchema.safeParse(data); // Valide les données avec le schéma dynamique
}