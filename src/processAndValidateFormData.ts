import { z } from 'zod';
import { extractDataFromFormData } from './extractDataFromFormData';
import { applyDataTransformations } from './applyDataTransformations';
import { validateDataWithDynamicSchema } from './validateDataWithDynamicSchema';
import {
  formatZodErrorsAsObject,
  formatZodErrorsAsArray,
} from './zod-error-formatters';
import { convertObjectToFormData } from './convertObjectToFormData';
import { FormDataProcessingOptions, ProcessedFormDataResult } from './types';

/**
 * Fonction complète pour traiter, transformer et valider les données de formulaire.
 * Elle extrait les données, les fusionne avec des données additionnelles si fournies,
 * applique des transformations personnalisées, valide l'ensemble avec un schéma Zod (potentiellement dynamique),
 * et retourne le résultat dans le format demandé (objet JavaScript typé ou FormData).
 * En cas de succès, le retour est directement utilisable pour une requête API.
 *
 * @template T Le type de la forme brute du schéma Zod qui définit la structure des données attendues.
 * @param {z.ZodObject<T>} schema - Le schéma Zod principal à utiliser pour la validation de TOUTES les données (formulaire + additionnelles).
 * @param {FormData | Record<string, unknown>} inputData - Les données brutes du formulaire (ou un objet JS). Il peut s'agir d'un objet `FormData` directement issu d'un événement de soumission de formulaire HTML, ou d'un simple objet JavaScript plat (`Record<string, unknown>`) si les données proviennent d'une autre source (par exemple, un corps de requête JSON ou un objet créé manuellement). La fonction gérera automatiquement l'extraction des champs appropriés de ces deux types d'entrée.
 * @param {FormDataProcessingOptions<T>} [options={}] - Options pour contrôler le pipeline de traitement. Cet objet permet de personnaliser en profondeur le comportement de la fonction, incluant la transformation des clés, l'inclusion/exclusion de champs, la stratégie de validation Zod, l'intégration de schémas additionnels, et des transformations de données ad-hoc. Chaque propriété est optionnelle et a une valeur par défaut prédéfinie.
 * @returns {ProcessedFormDataResult<T>} Un objet résultat indiquant succès/échec, les données formatées en cas de succès,
 * ou les erreurs et les données de débogage en cas d'échec. Ce type utilitaire encapsule la réponse de la fonction, offrant une gestion prévisible des scénarios de validation. En cas de succès (`success: true`), les données validées sont fournies, typées selon le schéma Zod. En cas d'échec (`success: false`), des informations détaillées sur les erreurs de validation sont retournées sous plusieurs formats (objet, tableau, chaîne de caractères) pour faciliter le débogage et l'affichage des messages d'erreur à l'utilisateur.
 *
 * @example
 * // 1. Définir votre DTO (schéma Zod) qui inclut tous les champs, y compris ceux "additionnels"
 * import { z } from 'zod';
 * const UserRegistrationSchema = z.object({
 * username: z.string().min(3, "Nom d'utilisateur trop court"),
 * email: z.string().email("Email invalide").transform(val => val.toLowerCase()),
 * password: z.string().min(8, "Mot de passe min 8 caractères"),
 * confirmPassword: z.string(),
 * // Champs qui pourraient venir de `additionalData` mais sont validés ici
 * source: z.enum(['web', 'mobile', 'api']).default('web'),
 * marketingOptIn: z.boolean().default(false),
 * }).refine(data => data.password === data.confirmPassword, {
 * message: "Les mots de passe ne correspondent pas",
 * path: ["confirmPassword"],
 * });
 *
 * // 2. Utiliser dans un gestionnaire de soumission de formulaire
 * async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
 * event.preventDefault();
 * const formData = new FormData(event.currentTarget);
 *
 * const result = processAndValidateFormData(UserRegistrationSchema, formData, {
 * outputFormat: 'object', // Ou 'formData' si votre API attend du multipart
 * additionalData: {
 * source: 'web', // Données qui ne viennent pas d'un input, mais nécessaires au DTO
 * marketingOptIn: true
 * },
 * // keyTransforms: { 'user_email_input': 'email' },
 * // transformations: {
 * // Exemple de transformation non gérée par Zod.coerce ou .transform()
 * // Note: Zod.coerce est généralement suffisant pour les conversions de base
 * // someNumericField: (value) => Number(value)
 * // }
 * });
 *
 * if (result.success) {
 * console.log("Données prêtes pour la requête :", result.data);
 * // result.data est soit un objet typé, soit un FormData, prêt à être envoyé
 * // Exemple avec fetch:
 * // if (result.data instanceof FormData) {
 * // await fetch('/api/register', { method: 'POST', body: result.data });
 * // } else {
 * // await fetch('/api/register', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(result.data) });
 * // }
 * } else {
 * console.error("Échec de la validation :", result.errorsInArray);
 * // Afficher les erreurs à l'utilisateur dans l'UI (ex: result.errors['email'])
 * }
 * }
 */
export function processAndValidateFormData<T extends z.ZodRawShape>(
  schema: z.ZodObject<T>,
  inputData: FormData | Record<string, unknown>,
  options: FormDataProcessingOptions<T> = {
    transformations: {},
    outputFormat: 'object',
    additionalData: {},
    validationStrategy: 'strict',
    schemaModification: 'default',
    additionalSchemas: [],
  }
): ProcessedFormDataResult<T> {
  const {
    transformations = {},
    outputFormat = 'object',
    additionalData = {},
    validationStrategy = 'strict',
    schemaModification = 'default',
    additionalSchemas = [],
    ...extractOptions
  } = options;

  // 1. Extraire les données du formulaire (ou de l'objet initial)
  const extractedFormData = extractDataFromFormData(inputData, extractOptions);

  // 2. Fusionner les données extraites avec les données supplémentaires
  // Les données supplémentaires peuvent écraser les données du formulaire si les clés sont les mêmes.
  // L'ordre est important ici : les données additionnelles doivent être fusionnées avant les transformations
  // et la validation principale, car elles en feront partie.
  let dataToProcess = { ...extractedFormData, ...additionalData };

  // 3. Appliquer les transformations personnalisées spécifiées (s'il y en a)
  // Ces transformations s'appliquent après l'extraction et la fusion, mais avant la validation Zod.
  dataToProcess = applyDataTransformations(dataToProcess, transformations);

  // 4. Valider l'ensemble des données avec le schéma Zod principal
  const validationResult = validateDataWithDynamicSchema(schema, dataToProcess, validationStrategy, schemaModification, additionalSchemas);

  if (validationResult.success) {
    // Validation réussie : préparer les données dans le format de sortie demandé
    const validatedAndTransformedData = validationResult.data as z.infer<
      z.ZodObject<T>
    >;

    if (outputFormat === 'formData') {
      return {
        success: true,
        data: convertObjectToFormData(validatedAndTransformedData),
      };
    } else {
      return {
        success: true,
        data: validatedAndTransformedData,
      };
    }
  } else {
    const errorsInArray = formatZodErrorsAsArray(validationResult);
    return {
      success: false,
      data: dataToProcess,
      errors: formatZodErrorsAsObject(validationResult),
      errorsInArray: errorsInArray,
      errorsInString: errorsInArray.map(e => e.message).join('\n'),
    };
  }
}
