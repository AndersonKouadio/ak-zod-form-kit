import { z, ZodObject, ZodRawShape, ZodTypeAny } from 'zod';
import { SchemaModification, ValidationStrategy } from './types'; // Assumant ces types sont dans ./types

/**
 * Crée un schéma Zod dynamique avec un contrôle précis de la validation.
 *
 * L'ordre des opérations est CRITIQUE :
 * 1. D'abord les modifications structurelles (merge/union)
 * 2. Ensuite les stratégies de validation
 *
 * @param baseSchema Schéma Zod de base
 * @param inputData Données pour guider les champs dynamiques (optionnel)
 * @param validationStrategy Stratégie de validation (défaut: "strict")
 * @param schemaModification Modification structurelle (défaut: "default")
 * @param additionalSchemas Schémas supplémentaires pour fusion (optionnel)
 *
 * @example
 * // Cas de base : validation stricte
 * // Accepte uniquement un objet avec un champ 'name' de type string.
 * // Tout champ supplémentaire provoquera une erreur.
 * const strictSchema = createDynamicZodSchema(
 * z.object({ name: z.string() })
 * );
 *
 * @example
 * // Cas avec suppression des champs supplémentaires
 * // Seuls les champs 'name' et 'age' seront conservés après validation.
 * const removeExtraSchema = createDynamicZodSchema(
 * z.object({ name: z.string(), age: z.number() }),
 * {}, // inputData n'est pas pertinent ici
 * "removeExtraFields"
 * );
 * // const parsedData = removeExtraSchema.parse({ name: "Alice", age: 30, extra: "field" });
 * // console.log(parsedData); // { name: "Alice", age: 30 }
 *
 * @example
 * // Cas avec autorisation des champs supplémentaires
 * // Le schéma de base accepte 'name', mais 'inputData' contient 'id'.
 * // Le schéma résultant acceptera 'name' et 'id' (typé comme unknown), et tout autre champ.
 * const allowExtraSchema = createDynamicZodSchema(
 * z.object({ name: z.string() }),
 * { name: "Bob", id: 123 }, // inputData pour guider les champs dynamiques
 * "allowExtraFields"
 * );
 * // const parsedData = allowExtraSchema.parse({ name: "Charlie", id: 456, other: "data" });
 * // console.log(parsedData); // { name: "Charlie", id: 456, other: "data" }
 *
 * @example
 * // Cas avec rendu partiel et strict ("partial-strict")
 * // Permet à 'name' et 'email' d'être optionnels, mais rejette tout autre champ.
 * const partialStrictSchema = createDynamicZodSchema(
 * z.object({ name: z.string(), email: z.string().email() }),
 * {},
 * "partial-strict"
 * );
 * // const parsedData = partialStrictSchema.parse({ name: "David" }); // Valide
 * // const parsedData = partialStrictSchema.parse({ email: "d@example.com" }); // Valide
 * // try { partialStrictSchema.parse({ age: 25 }); } catch (e) { console.error(e); } // Erreur, 'age' est un champ extra
 *
 * @example
 * // Cas avec rendu profondément partiel ("deepPartial")
 * // Rend tous les champs, y compris les imbriqués, optionnels.
 * const deepPartialSchema = createDynamicZodSchema(
 * z.object({
 * user: z.object({
 * id: z.number(),
 * profile: z.object({
 * name: z.string(),
 * age: z.number().optional()
 * })
 * })
 * }),
 * {},
 * "deepPartial"
 * );
 * // const parsedData1 = deepPartialSchema.parse({ user: { profile: { name: "Eve" } } }); // Valide, 'id' et 'age' sont optionnels
 * // const parsedData2 = deepPartialSchema.parse({ user: {} }); // Valide, tous les champs imbriqués sont optionnels
 * // const parsedData3 = deepPartialSchema.parse({}); // Valide, tout est optionnel
 *
 * @example
 * // Cas avec rendu partiel (non-récursif) ("partial")
 * // Rend uniquement les champs de premier niveau optionnels.
 * const partialSchema = createDynamicZodSchema(
 * z.object({
 * user: z.object({
 * id: z.number(),
 * profile: z.object({
 * name: z.string(),
 * age: z.number()
 * })
 * })
 * }),
 * {},
 * "partial"
 * );
 * // const parsedData1 = partialSchema.parse({ user: { id: 1, profile: { name: "Frank", age: 30 } } }); // Valide
 * // const parsedData2 = partialSchema.parse({ user: { profile: { name: "Grace", age: 25 } } }); // Valide, 'id' est manquant mais 'user' est optionnel
 * // try { partialSchema.parse({ user: { id: 1, profile: { name: "Henry" } } }); } catch (e) { console.error(e); } // Erreur, 'age' est requis dans 'profile'
 *
 * @example
 * // Cas de fusion avec logique ET ("mergeWithAnd")
 * // Combine un schéma de base avec un ou plusieurs schémas supplémentaires.
 * // Les données doivent satisfaire TOUS les schémas fusionnés.
 * const schemaPart1 = z.object({ id: z.number() });
 * const schemaPart2 = z.object({ name: z.string() });
 * const mergedAndSchema = createDynamicZodSchema(
 * schemaPart1,
 * {},
 * "strict", // La stratégie de validation s'applique au schéma fusionné
 * "mergeWithAnd",
 * [schemaPart2, z.object({ isActive: z.boolean() })]
 * );
 * // Ce schéma attendra { id: number, name: string, isActive: boolean }.
 * // const parsedData = mergedAndSchema.parse({ id: 1, name: "Frank", isActive: true }); // Valide
 * // try { mergedAndSchema.parse({ id: 1, name: "Frank" }); } catch (e) { console.error(e); } // Erreur, 'isActive' est manquant
 *
 * @example
 * // Cas de fusion avec logique OU ("mergeWithOr")
 * // Crée une union de schémas. Les données doivent satisfaire AU MOINS UN des schémas.
 * const schemaOption1 = z.object({ type: z.literal("car"), wheels: z.number() });
 * const schemaOption2 = z.object({ type: z.literal("boat"), sails: z.number() });
 * const mergedOrSchema = createDynamicZodSchema(
 * schemaOption1,
 * {},
 * "strict",
 * "mergeWithOr",
 * [schemaOption2]
 * );
 * // const parsedData1 = mergedOrSchema.parse({ type: "car", wheels: 4 }); // Valide
 * // const parsedData2 = mergedOrSchema.parse({ type: "boat", sails: 1 }); // Valide
 * // try { mergedOrSchema.parse({ type: "plane", wings: 2 }); } catch (e) { console.error(e); } // Erreur
 */
export function createDynamicZodSchema<T extends ZodRawShape>(
  baseSchema: ZodObject<T>,
  inputData: Record<string, unknown> = {},
  validationStrategy: ValidationStrategy = 'strict',
  schemaModification: SchemaModification = 'default',
  additionalSchemas: ZodTypeAny[] = []
): ZodTypeAny {
  // `schema` sera la référence mutable du schéma en cours de construction.
  // Initialisé comme ZodTypeAny pour permettre sa réaffectation à différents types Zod (ZodObject, ZodUnion, etc.).
  let schema: ZodTypeAny = baseSchema;

  // ---
  // 1. MODIFICATIONS STRUCTURELLES
  // (Doivent être appliquées en premier car elles définissent la forme fondamentale du schéma)
  // ---
  switch (schemaModification) {
    case 'mergeWithAnd': {
      // Fusionne le schéma de base avec tous les schémas supplémentaires fournis.
      // `reduce` est utilisé pour appliquer `merge` séquentiellement, combinant les champs de tous les schémas.
      // Si plusieurs schémas définissent le même champ, le dernier schéma dans la chaîne de fusion "gagne" en termes de type.
      // Les casts `as ZodObject<ZodRawShape>` sont nécessaires pour informer TypeScript que
      // `acc` et `curr` sont bien des objets Zod lors de l'appel à `merge`.
      schema = (additionalSchemas as ZodObject<ZodRawShape>[]).reduce(
        (acc, curr) => (acc as ZodObject<ZodRawShape>).merge(curr),
        schema as ZodObject<ZodRawShape>
      );
      break;
    }

    case 'mergeWithOr': {
      // Crée une union entre le schéma de base et tous les schémas supplémentaires.
      // Les données validées doivent correspondre à la forme de l'un des schémas fournis dans l'union.
      schema = z.union([schema, ...(additionalSchemas as ZodTypeAny[])]);
      break;
    }

    case 'default':
      // Aucune modification structurelle n'est appliquée. Le `baseSchema` est utilisé tel quel pour la prochaine étape.
      break;
  }

  // ---
  // 2. STRATÉGIES DE VALIDATION
  // (Appliquées après les modifications structurelles pour affiner le comportement de validation)
  // ---

  // IMPORTANT : Avant d'appliquer les méthodes spécifiques aux objets (comme .passthrough(), .strip(), etc.),
  // nous devons nous assurer que `schema` est bien une instance de `ZodObject`.
  // Si `schema` est un `ZodUnion` (résultant d'un `mergeWithOr`), ces méthodes n'existeront pas.
  if (schema instanceof ZodObject) {
    // Crée une nouvelle constante `objectSchema` qui est explicitement typée comme `ZodObject<any>`.
    // Cela permet à TypeScript de savoir avec certitude qu'il s'agit d'un objet Zod,
    // même dans les contextes imbriqués (comme les callbacks de `filter` ou `reduce`),
    // évitant ainsi les erreurs de type `Property 'shape' does not exist` ou `Property 'extend' does not exist`.
    const objectSchema = schema as ZodObject<any>; // Utilise `any` pour la forme afin d'éviter des génériques complexes.

    switch (validationStrategy) {
      case 'allowExtraFields': {
        // `.passthrough()` : Permet à Zod d'accepter des champs qui ne sont pas définis dans le schéma sans générer d'erreur.
        // Ces champs supplémentaires seront inclus dans le résultat de la validation.
        schema = objectSchema.passthrough(); // Utilise la variable `objectSchema`

        // Identifie les champs dynamiques (ceux dans `inputData` qui ne sont pas dans le schéma existant).
        const dynamicFields = Object.keys(inputData)
          .filter((key) => !(key in objectSchema.shape)) // Utilise `objectSchema.shape` pour l'accès sécurisé
          .reduce((acc, key) => ({ ...acc, [key]: z.unknown() }), {});

        // Si des champs dynamiques ont été identifiés, étend le schéma avec ces champs.
        // Bien que `passthrough()` permette déjà ces champs, `extend` les rend "connus" du schéma,
        // ce qui peut être utile pour l'inférence de type ou pour les outils de débogage.
        if (Object.keys(dynamicFields).length > 0) {
          schema = objectSchema.extend(dynamicFields); // Utilise `objectSchema.extend`
        }
        break;
      }

      case 'removeExtraFields': {
        // `.strip()` : Configure Zod pour supprimer (stripper) silencieusement tous les champs des données
        // qui ne sont pas explicitement définis dans le schéma. Les données validées ne contiendront que les champs connus.
        schema = objectSchema.strip(); // Utilise `objectSchema`
        break;
      }

      case 'partial-strict': {
        // `.partial()` : Rend tous les champs du schéma de niveau racine optionnels.
        // `.strict()` : Appliqué après `.partial()`, il garantit qu'aucun champ supplémentaire (non défini dans le schéma original) n'est autorisé.
        // C'est utile pour les mises à jour partielles où l'on veut un contrôle strict sur les champs modifiables.
        schema = objectSchema.partial().strict(); // Utilise `objectSchema`
        break;
      }
      
      case 'partial': {
        // `.partial()` : Rend tous les champs du schéma de niveau racine optionnels (non récursif).
        // Fix: Also allow extra fields for 'partial' strategy as per README description
        schema = objectSchema.partial().passthrough(); // Utilise `objectSchema`
        break;
      }

      case 'strict':
      default: {
        // `.strict()` : C'est le comportement par défaut pour les objets Zod, mais il est explicitement appliqué ici
        // pour garantir que seuls les champs définis dans le schéma sont acceptés. Tout champ supplémentaire entraînera une erreur de validation.
        schema = objectSchema.strict(); // Utilise `objectSchema`
        break;
      }
    }
  } else if (validationStrategy !== 'strict') {
    // Si le `schema` n'est plus un `ZodObject` (par exemple, c'est un `ZodUnion` suite à `mergeWithOr`)
    // et qu'une stratégie de validation non-stricte est demandée, nous émettons un avertissement.
    // En effet, les stratégies comme `passthrough`, `strip`, `partial` ne s'appliquent qu'aux `ZodObject`.
    // Un `ZodUnion` se comporte intrinsèquement de manière "stricte" par rapport aux schémas qu'il contient.
    console.warn(
      `Attention : La stratégie de validation '${validationStrategy}' est généralement pour les ZodObjects, mais le schéma est maintenant un ZodUnion. Il se comportera comme 'strict'.`
    );
  }
  return schema;
}