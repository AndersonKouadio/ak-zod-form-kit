import * as z from 'zod';

/**
 * Type utilitaire pour extraire le type inféré d'un champ d'un schéma Zod.
 * Il permet d'obtenir le type TypeScript précis qui sera produit après la validation Zod d'un champ donné.
 *
 * @template T Le type du schéma Zod pour le champ spécifique (par exemple, `z.string()`, `z.number().optional()`).
 * @returns Le type TypeScript correspondant au type de données inféré par Zod pour le champ.
 *
 * @example
 * // Pour un champ `z.string()`
 * type MyStringType = SchemaFieldType<typeof z.string()>; // Résout à `string`
 *
 * @example
 * // Pour un champ `z.number().optional()`
 * type MyOptionalNumberType = SchemaFieldType<typeof z.number().optional()>; // Résout à `number | undefined`
 */
export type SchemaFieldType<T extends z.ZodTypeAny> = T extends z.ZodType<
  infer U
>
  ? U
  : never;

/**
 * Définit les options configurables pour l'extraction de données à partir d'un objet FormData ou d'un objet JavaScript.
 */
export interface FormDataExtractionOptions {
  /**
   * Un objet de mappage où les clés sont les noms originaux des champs dans les données d'entrée,
   * et les valeurs sont les nouveaux noms que ces champs prendront dans l'objet de sortie.
   * Utile pour harmoniser les noms de champs provenant de différentes sources (ex: champs HTML spécifiques).
   * @example
   * { 'user_name_input': 'name', 'user_email_address': 'email' }
   */
  keyTransforms?: Record<string, string>;
  /**
   * Un tableau de chaînes de caractères représentant les noms des champs qui doivent être exclus
   * de l'objet de données extrait. Ces champs seront ignorés, même s'ils sont présents dans l'entrée.
   * @example
   * ['passwordConfirm', 'csrf_token']
   */
  excludeFields?: string[];
  /**
   * Un tableau de chaînes de caractères représentant les noms des champs qui doivent être inclus
   * dans l'objet de données extrait. Si cette option est spécifiée, seuls les champs listés ici
   * seront extraits. L'option `excludeFields` prime sur `includeFields` si un champ est listé dans les deux.
   * @example
   * ['firstName', 'lastName', 'email']
   */
  includeFields?: string[];
}

/**
 * Définit les options pour la fonction `processAndValidateFormData`, permettant de contrôler
 * l'extraction, la transformation et la validation des données de formulaire.
 * @template T Le type de la forme brute du schéma Zod (par exemple, `{ name: z.string() }`).
 */
export interface FormDataProcessingOptions<T extends z.ZodRawShape>
  extends FormDataExtractionOptions {
  /**
   * Indique si la validation doit s'effectuer en utilisant un schéma Zod dynamique (par `createDynamicZodSchema`).
   * Si `true` (par défaut), le schéma s'adapte aux champs présents dans les données, acceptant `z.unknown()`
   * pour les champs non définis dans le schéma de base. Si `false`, seule la validation stricte du `schema`
   * fourni est appliquée, ce qui peut entraîner des erreurs pour les champs "extra".
   * @default true
   */
  useDynamicValidation?: boolean;
  /**
   * Un objet de fonctions de transformation personnalisées à appliquer aux champs après l'extraction
   * mais avant la validation Zod finale. Ces transformations s'ajoutent à celles potentiellement
   * définies directement dans le schéma Zod (via `.transform()` ou `.coerce`).
   * Utile pour des logiques de transformation qui ne sont pas intrinsèques au schéma Zod.
   *
   * @template K La clé du champ à transformer.
   * @param {SchemaFieldType<T[K]>} value - La valeur du champ avant la transformation.
   * @returns {SchemaFieldType<T[K]>} La valeur du champ après la transformation.
   */
  transformations?: {
    [K in keyof T]?: T[K] extends z.ZodTypeAny
      ? (value: SchemaFieldType<T[K]>) => SchemaFieldType<T[K]>
      : never;
  };
  /**
   * Spécifie le format de sortie des données en cas de succès de la validation.
   * - `'object'`: Les données validées seront retournées sous forme d'objet JavaScript (par défaut).
   * - `'formData'`: Les données validées seront converties en un objet `FormData`.
   * @default 'object'
   */
  outputFormat?: 'object' | 'formData';
  /**
   * Un objet contenant des données supplémentaires à fusionner avec les données extraites du formulaire.
   * Ces données seront fusionnées AVANT la validation Zod. Si des champs dans `additionalData`
   * sont également dans le formulaire et le schéma Zod, les règles de Zod s'appliqueront à la valeur fusionnée.
   * Notez que ces données ne sont PAS validées par un schéma séparé ici ; elles sont intégrées au schéma principal.
   */
  additionalData?: Record<string, unknown>;
}

/**
 * Type de retour unifié pour `processAndValidateFormData`.
 * @template T Le type inféré du schéma Zod principal.
 */
export type ProcessedFormDataResult<T extends z.ZodRawShape> =
  | {
      success: true;
      data: z.infer<z.ZodObject<T>> | FormData; // Les données validées, soit en objet, soit en FormData
    }
  | {
      success: false;
      data: Record<string, unknown>; // Les données (brutes/transformées) en cas d'échec pour le débogage/affichage
      errors: Record<string, string>; // Erreurs formatées en objet
      errorsInArray: { key: string; message: string }[]; // Erreurs formatées en tableau
    };
