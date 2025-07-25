# 🚀 AK Zod Form Kit

[![npm version](https://img.shields.io/npm/v/ak-zod-form-kit.svg)](https://www.npmjs.com/package/ak-zod-form-kit)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://github.com/AndersonKouadio/ak-zod-form-kit/blob/main/LICENSE)
[![GitHub issues](https://img.shields.io/github/issues/AndersonKouadio/ak-zod-form-kit.svg)](https://github.com/AndersonKouadio/ak-zod-form-kit/issues)
[![GitHub stars](https://img.shields.io/github/stars/AndersonKouadio/ak-zod-form-kit.svg)](https://github.com/AndersonKouadio/ak-zod-form-kit/stargazers)

Une librairie TypeScript moderne qui transforme vos formulaires en APIs typées sans effort ! ✨

**AK Zod Form Kit** simplifie drastiquement le traitement, la transformation et la validation des données de formulaire en utilisant la puissance de [Zod](https://zod.dev/). Fini les validations manuelles fastidieuses - transformez vos données brutes en objets typés et validés en une seule ligne !

## 🎯 Pourquoi AK Zod Form Kit ?

Gérer les données de formulaires peut rapidement devenir répétitif et source d'erreurs, surtout avec TypeScript et des APIs exigeantes. AK Zod Form Kit résout ce problème en offrant une solution robuste et élégante.

**// ❌ Avant : Code verbeux et répétitif**
```typescript
function handleForm(formData: FormData) {
  const data: any = {};
  const errors: any = {};

  const name = formData.get('name');
  if (!name || String(name).length < 2) {
    errors.name = 'Nom requis (min 2 caractères)';
  }
  data.name = String(name || '').trim();

  const email = formData.get('email');
  if (!email || !String(email).includes('@')) { // Simplifié pour l'exemple
    errors.email = 'Email invalide';
  }
  data.email = String(email || '').toLowerCase();

  // ... répéter pour chaque champ 😴
  if (Object.keys(errors).length > 0) {
    console.error("Validation failed", errors);
    return;
  }
  console.log("Data ready", data);
}
````

**// ✅ Après : Simple, typé et élégant**

```typescript
import { z } from 'zod';
import { processAndValidateFormData } from 'ak-zod-form-kit'; // Votre package !

const UserSchema = z.object({
  name: z.string().min(2, 'Nom requis (min 2 caractères)'),
  email: z.string().email('Email invalide').transform(v => v.toLowerCase()),
  age: z.coerce.number().min(18, 'Majorité requise') // z.coerce.number gère '25' -> 25
});

function handleSubmit(event: Event) {
  event.preventDefault();
  const formData = new FormData(event.target as HTMLFormElement);

  const result = processAndValidateFormData(UserSchema, formData, {
    transformations: { name: (v: string) => v.trim() } // Transformation personnalisée
  });

  if (result.success) {
    // result.data est 100% typé ! 🎉
    console.log(result.data.name); // TypeScript sait que c'est un string
    console.log(result.data.email); // TypeScript sait que c'est un string
    console.log(result.data.age);   // TypeScript sait que c'est un number
    // await sendToAPI(result.data);
  } else {
    // Erreurs formatées pour votre UI
    console.error("Validation failed!");
    console.log(result.errors);      // { name: "Nom requis...", email: "Email invalide" }
    console.log(result.errorsInArray); // [{ key: 'name', message: '...' }]
  }
}
```

## 🚀 Installation

```bash
npm install ak-zod-form-kit zod
# ou
yarn add ak-zod-form-kit zod
# ou
pnpm add ak-zod-form-kit zod
```

## ⚡ Démarrage rapide

```typescript
import { z } from 'zod';
import { processAndValidateFormData } from 'ak-zod-form-kit';

// 1️⃣ Définir votre schéma Zod
const ContactSchema = z.object({
  name: z.string().min(2, "Nom requis"),
  email: z.string().email("Email invalide"),
  message: z.string().min(10, "Message trop court"),
  newsletter: z.coerce.boolean().default(false) // Gère 'true'/'false' des checkbox
});

// 2️⃣ Traiter le formulaire dans votre gestionnaire de soumission
// (Compatible React, Vue, Angular, ou Vanilla JS)
async function handleSubmit(event: React.FormEvent<HTMLFormElement>) { // Exemple React
  event.preventDefault();
  const formData = new FormData(event.currentTarget);

  const result = processAndValidateFormData(ContactSchema, formData);

  if (result.success) {
    // ✅ Données validées et typées ! Prêtes pour votre API.
    console.log("Données à envoyer:", result.data);
    // Type: { name: string, email: string, message: string, newsletter: boolean }
    // await fetch('/api/contact', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(result.data)
    // });
    alert('Message envoyé !');
  } else {
    // ❌ Erreurs prêtes pour l'affichage dans votre UI
    console.error("Erreurs de validation:", result.errors);
    // setErrors(result.errors); // Ex: pour mettre à jour l'état d'un formulaire React
  }
}

// Exemple d'attachement pour Vanilla JS:
// document.getElementById('my-contact-form').addEventListener('submit', handleSubmit);
```

## 🌟 Fonctionnalités principales

### ✨ Validation intelligente

  * **Statique vs Dynamique**: Validez strictement selon votre schéma ou utilisez l'option `useDynamicValidation: true` (par défaut) pour accepter les champs supplémentaires comme `unknown()`, évitant ainsi des erreurs inattendues pour des champs non prévus dans le schéma de base.
  * **Erreurs formatées**: Recevez des messages d'erreur clairs, soit sous forme d'objet (`{ champ: "message" }`), soit sous forme de tableau (`[{ key: "champ", message: "message" }]`), pour une intégration facile dans vos composants UI.

### 🔄 Transformations puissantes

Appliquez des logiques de transformation complexes à vos données avant la validation Zod finale, complétant ainsi les capacités de `.transform()` et `.coerce` de Zod.

```typescript
const MySchema = z.object({
  email: z.string().email(),
  tags: z.array(z.string()),
  price: z.number(),
});

const rawData = {
  email: '   MY_EMAIL@EXAMPLE.COM   ',
  tags: 'tag1, tag2 , tag3',
  price: '123.45'
};

const result = processAndValidateFormData(MySchema, rawData, {
  transformations: {
    email: (email: string) => email.toLowerCase().trim(), // Nettoyage
    tags: (tags: string) => tags.split(',').map(tag => tag.trim()), // Chaîne à tableau
    price: (price: string) => parseFloat(price) // Chaîne à nombre
  }
});

if (result.success) {
  console.log(result.data);
  // { email: 'my_email@example.com', tags: ['tag1', 'tag2', 'tag3'], price: 123.45 }
}
```

### 📎 Support complet des fichiers et `FormData`

Gérez les `File` et `Blob` directement dans votre schéma et préparez les données pour les envois `multipart/form-data`.

```typescript
import { z } from 'zod';
import { processAndValidateFormData } from 'ak-zod-form-kit';

const FileUploadSchema = z.object({
  title: z.string().min(1, "Titre requis"),
  document: z.instanceof(File).refine(file => file.size < 5_000_000, "Le fichier doit être inférieur à 5MB."),
  category: z.enum(['image', 'document', 'video']),
});

// Imaginez que `formData` provient d'un <form> avec un input type="file"
const formData = new FormData();
formData.append('title', 'Mon rapport annuel');
formData.append('document', new File(['contenu test'], 'rapport.pdf', { type: 'application/pdf' }));
formData.append('category', 'document');

const result = processAndValidateFormData(FileUploadSchema, formData, {
  outputFormat: 'formData' // Prêt pour `fetch` avec `multipart/form-data` !
});

if (result.success) {
  // `result.data` est un objet `FormData`
  console.log("FormData prêt pour l'upload:", result.data);
  await fetch('/api/upload-document', {
    method: 'POST',
    body: result.data // Envoyez directement le FormData !
  });
} else {
  console.error("Erreurs d'upload:", result.errors);
}
```

### 🎛️ Extraction flexible et données additionnelles

Contrôlez précisément quels champs sont extraits, renommés, inclus ou exclus, et fusionnez des données provenant d'autres sources.

```typescript
const UserProfileSchema = z.object({
  firstName: z.string(),
  lastName: z.string(),
  email: z.string().email(),
  userId: z.string(), // Champ provenant de `additionalData`
  createdAt: z.date(), // Champ provenant de `additionalData`
});

const rawFormData = {
  'user_firstname': 'Jean', // Nom d'input HTML
  'user_lastname': 'Dupont',
  'email_address': 'jean.dupont@example.com',
  'csrf_token': 'abc123xyz' // Champ à exclure
};

const result = processAndValidateFormData(UserProfileSchema, rawFormData, {
  keyTransforms: {
    'user_firstname': 'firstName',
    'user_lastname': 'lastName',
    'email_address': 'email'
  }, // Renommage des clés HTML vers les noms du schéma
  excludeFields: ['csrf_token'], // Exclusion de champs non pertinents
  includeFields: ['firstName', 'lastName', 'email'], // Inclusion sélective (si souhaité)
  additionalData: {
    userId: 'user-12345', // Données backend ou session
    createdAt: new Date('2023-01-15T10:00:00Z')
  }
});

if (result.success) {
  console.log(result.data);
  /*
  {
    firstName: 'Jean',
    lastName: 'Dupont',
    email: 'jean.dupont@example.com',
    userId: 'user-12345',
    createdAt: Date('2023-01-15T10:00:00Z')
  }
  */
}
```

## 📚 Exemples d'usage

### 🔐 Formulaire d'inscription avancé

```typescript
import { z } from 'zod';
import { processAndValidateFormData } from 'ak-zod-form-kit';

const RegisterSchema = z.object({
  username: z.string().min(3, "Nom d'utilisateur minimum 3 caractères").max(20, "Nom d'utilisateur maximum 20 caractères"),
  email: z.string().email("Adresse email invalide"),
  password: z.string().min(8, "Le mot de passe doit contenir au moins 8 caractères"),
  confirmPassword: z.string(),
  acceptTerms: z.coerce.boolean().refine(val => val, "Vous devez accepter les conditions d'utilisation"),
}).refine(data => data.password === data.confirmPassword, {
  message: "Les mots de passe ne correspondent pas",
  path: ["confirmPassword"]
});

async function handleRegisterSubmit(event: React.FormEvent<HTMLFormElement>) {
  event.preventDefault();
  const formData = new FormData(event.currentTarget);

  const result = processAndValidateFormData(RegisterSchema, formData, {
    additionalData: { source: 'web', registeredAt: new Date() }, // Ajout de métadonnées
    transformations: {
      username: (v: string) => v.toLowerCase().trim(), // Nettoyage automatique
      email: (v: string) => v.toLowerCase() // Email en minuscules
    }
  });

  if (result.success) {
    console.log("Utilisateur enregistré:", result.data);
    // Envoyer à l'API
  } else {
    console.error("Erreurs d'inscription:", result.errors);
  }
}
```

### ⚛️ Intégration avec React Hook Form

Zod Form Kit peut travailler de concert avec d'autres librairies de formulaires, bien que souvent il puisse les remplacer pour la logique de validation et transformation.

```typescript
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod'; // Pour intégrer Zod avec RHF
import { z } from 'zod';
import { processAndValidateFormData } from 'ak-zod-form-kit';

const MyFormSchema = z.object({
  name: z.string().min(1, "Nom est requis"),
  email: z.string().email("Email invalide"),
});

function MyForm() {
  // `useForm` gère l'état des inputs et la soumission
  const { register, handleSubmit, formState: { errors }, setError } = useForm({
    resolver: zodResolver(MyFormSchema) // Utilise zodResolver pour valider avec MyFormSchema
  });

  const [loading, setLoading] = useState(false);

  // `onSubmit` est appelé par React Hook Form si la validation de `MyFormSchema` est réussie
  const onSubmit = async (data: z.infer<typeof MyFormSchema>) => {
    setLoading(true);
    // Ici, `data` est déjà validé par `zodResolver`.
    // Zod Form Kit peut être utilisé pour des transformations ou l'ajout de données additionnelles
    // AVANT l'envoi, ou si vous n'utilisez PAS `zodResolver` et voulez gérer toute la logique.

    // Si vous voulez appliquer des transformations *supplémentaires* ou `additionalData`
    // avant l'envoi, Zod Form Kit reste utile :
    const finalResult = processAndValidateFormData(MyFormSchema, data, {
      outputFormat: 'object',
      additionalData: { timestamp: new Date().toISOString() } // Exemple d'ajout
    });

    if (finalResult.success) {
      console.log("Données prêtes pour l'API:", finalResult.data);
      // await apiCall(finalResult.data);
      alert('Formulaire envoyé avec succès !');
    } else {
      // Si des erreurs surviennent à cause de `additionalData` ou `transformations`
      // qui invalideraient le schéma après ces étapes
      Object.entries(finalResult.errors).forEach(([field, message]) => {
        setError(field as any, { message });
      });
      alert('Erreur lors du traitement final.');
    }
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div>
        <label htmlFor="name">Nom:</label>
        <input id="name" {...register('name')} placeholder="Votre nom" />
        {errors.name && <span style={{ color: 'red' }}>{errors.name.message}</span>}
      </div>

      <div>
        <label htmlFor="email">Email:</label>
        <input id="email" type="email" {...register('email')} placeholder="Email" />
        {errors.email && <span style={{ color: 'red' }}>{errors.email.message}</span>}
      </div>

      <button type="submit" disabled={loading}>
        {loading ? 'Envoi...' : 'Envoyer'}
      </button>
    </form>
  );
}

export default MyForm; // Pour l'utiliser dans votre application React
```

### 🎨 Gestion d'erreurs dans l'UI

Intégrez facilement les erreurs formatées dans votre interface utilisateur.

```typescript
import React, { useState } from 'react';
import { z } from 'zod';
import { processAndValidateFormData } from 'ak-zod-form-kit';

const ContactSchema = z.object({
  name: z.string().min(2, "Votre nom est requis (min 2 caractères)"),
  email: z.string().email("Veuillez saisir une adresse email valide"),
  message: z.string().min(10, "Votre message est trop court (min 10 caractères)")
});

function ContactForm() {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget as HTMLFormElement);
    const result = processAndValidateFormData(ContactSchema, formData);

    if (result.success) {
      setErrors({}); // Nettoie les erreurs précédentes
      console.log("Message à envoyer:", result.data);
      // await sendMessage(result.data); // Ex: Appel API
      alert('Message envoyé avec succès !');
    } else {
      setErrors(result.errors); // Met à jour l'état avec les nouvelles erreurs
      // Optionnel : focus sur le premier champ en erreur pour améliorer l'UX
      const firstError = result.errorsInArray[0];
      if (firstError) {
        document.querySelector(`[name="${firstError.key}"]`)?.focus();
      }
    }

    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px', maxWidth: '400px', margin: 'auto' }}>
      <div>
        <label htmlFor="name">Nom:</label>
        <input id="name" name="name" placeholder="Votre nom" style={{ width: '100%', padding: '8px' }} />
        {errors.name && <span style={{ color: 'red', fontSize: '0.8em' }}>{errors.name}</span>}
      </div>

      <div>
        <label htmlFor="email">Email:</label>
        <input id="email" name="email" type="email" placeholder="Email" style={{ width: '100%', padding: '8px' }} />
        {errors.email && <span style={{ color: 'red', fontSize: '0.8em' }}>{errors.email}</span>}
      </div>

      <div>
        <label htmlFor="message">Message:</label>
        <textarea id="message" name="message" placeholder="Votre message" rows={5} style={{ width: '100%', padding: '8px' }}></textarea>
        {errors.message && <span style={{ color: 'red', fontSize: '0.8em' }}>{errors.message}</span>}
      </div>

      <button type="submit" disabled={loading} style={{ padding: '10px 15px', cursor: 'pointer' }}>
        {loading ? 'Envoi...' : 'Envoyer'}
      </button>
    </form>
  );
}

export default ContactForm; // Pour l'utiliser dans votre application React
```

## 🔧 API Reference

### `processAndValidateFormData<T extends z.ZodRawShape>(schema: z.ZodObject<T>, inputData: FormData | Record<string, unknown>, options?: FormDataProcessingOptions<T>): ProcessedFormDataResult<T>`

La fonction principale qui orchestre le traitement, la transformation et la validation de vos données.

  * `schema`: Votre [schéma Zod](https://zod.dev/) principal définissant la structure et les règles de validation attendues.
  * `inputData`: Les données brutes à traiter, qui peuvent être un objet `FormData` (directement issu d'un formulaire HTML) ou un objet JavaScript (`Record<string, unknown>`).
  * `options?`: Un objet de configuration optionnel pour personnaliser le pipeline de traitement. Voir `FormDataProcessingOptions` ci-dessous.

Retourne un objet de type `ProcessedFormDataResult<T>`.

#### `FormDataProcessingOptions<T extends z.ZodRawShape>`

Étend l'interface `FormDataExtractionOptions`.

  * `useDynamicValidation?: boolean;` (par défaut: `true`)
    Si `true`, les champs présents dans `inputData` qui ne sont pas définis dans votre `schema` seront acceptés comme `z.unknown()`. Si `false`, une validation stricte est appliquée, et tout champ "extra" non défini dans le schéma causera une erreur.
  * `transformations?: { [K in keyof T]?: T[K] extends z.ZodTypeAny ? (value: SchemaFieldType<T[K]>) => SchemaFieldType<T[K]> : never; };`
    Un objet de fonctions de transformation personnalisées à appliquer aux champs *après l'extraction mais avant la validation Zod finale*. Ces transformations sont utiles pour des logiques spécifiques non gérées par `.transform()` ou `.coerce` de Zod.
  * `outputFormat?: 'object' | 'formData';` (par défaut: `'object'`)
    Spécifie le format des données retournées dans la propriété `data` en cas de succès de la validation. `object` retourne un objet JavaScript typé ; `formData` retourne un objet `FormData`.
  * `additionalData?: Record<string, unknown>;`
    Un objet contenant des données supplémentaires à fusionner avec les données extraites du formulaire. Ces données sont fusionnées *avant* la validation Zod, permettant de valider un ensemble complet de données (formulaire + ajoutées).

#### `FormDataExtractionOptions`

  * `keyTransforms?: Record<string, string>;`
    Un objet de mappage pour renommer les clés des champs extraits. Utile si les noms de vos inputs HTML diffèrent des noms de propriétés de votre schéma. Ex: `{ 'user_email_input': 'email' }`.
  * `excludeFields?: string[];`
    Un tableau de noms de champs à ignorer complètement lors de l'extraction. Ex: `['_csrf_token', 'password_confirm']`.
  * `includeFields?: string[];`
    Un tableau de noms de champs à inclure exclusivement. Si cette option est spécifiée, seuls les champs listés ici seront extraits. `excludeFields` prime si un champ est présent dans les deux listes.

#### `ProcessedFormDataResult<T extends z.ZodRawShape>`

Le type de retour de la fonction `processAndValidateFormData`.

  * **En cas de succès (`success: true`)**:
    ```typescript
    {
      success: true;
      data: z.infer<z.ZodObject<T>> | FormData; // Les données validées, typées, soit en objet, soit en FormData
    }
    ```
  * **En cas d'échec (`success: false`)**:
    ```typescript
    {
      success: false;
      data: Record<string, unknown>; // Les données (brutes/transformées) ayant échoué la validation, pour le débogage/affichage
      errors: Record<string, string>; // Erreurs formatées en objet (chemin du champ -> message)
      errorsInArray: { key: string; message: string }[]; // Erreurs formatées en tableau d'objets ({ key: 'champ', message: '...' })
    }
    ```

### Fonctions utilitaires exportées

Ces fonctions sont les briques de base utilisées par `processAndValidateFormData` et peuvent être importées et utilisées indépendamment si vous avez besoin d'une logique plus granulaire.

  * `extractDataFromFormData(data: FormData | Record<string, unknown>, options?: FormDataExtractionOptions): Record<string, unknown>`
    Extrait et organise les données d'un objet `FormData` ou `Record<string, unknown>` avec des options de transformation de clés, inclusion/exclusion.

  * `applyDataTransformations(data: Record<string, unknown>, transformations: Record<string, (value: unknown) => unknown>): Record<string, unknown>`
    Applique un ensemble de fonctions de transformation à des champs spécifiques d'un objet de données.

  * `convertObjectToFormData(inputObject: Record<string, unknown>): FormData`
    Convertit un objet JavaScript standard en un objet `FormData`, gérant les types complexes (fichiers, blobs, dates, tableaux, objets imbriqués).

  * `createDynamicZodSchema<T extends z.ZodRawShape>(baseSchema: z.ZodObject<T>, data: Record<string, unknown>): z.ZodObject<any>`
    Construit un schéma Zod dynamique basé sur un schéma de base et la structure des données d'entrée, acceptant `z.unknown()` pour les champs non définis.

  * `validateDataWithDynamicSchema<T extends z.ZodRawShape>(baseSchema: z.ZodObject<T>, inputData: Record<string, unknown>): z.ZodSafeParseResult<Record<string, unknown>>`
    Valide un objet de données en utilisant un schéma Zod dynamique créé à partir du `baseSchema` et `inputData`.

  * `formatZodErrorsAsObject(validationResult: z.ZodSafeParseResult<any>): { [key: string]: string }`
    Convertit les erreurs détaillées d'un résultat de validation Zod en un objet plat (chemin du champ -\> message).

  * `formatZodErrorsAsArray(validationResult: z.ZodSafeParseResult<any>): { key: string; message: string }[]`
    Convertit les erreurs détaillées d'un résultat de validation Zod en un tableau d'objets (`{ key: string; message: string }`).

## 🎯 Cas d'usage recommandés

AK Zod Form Kit est une solution idéale pour :

  * ✅ Les formulaires complexes avec des validations métier spécifiques.
  * ✅ L'upload de fichiers accompagnés de métadonnées.
  * ✅ La gestion des APIs hybrides nécessitant à la fois du JSON et du `multipart/form-data`.
  * ✅ La transformation de données brutes avant leur envoi à un backend.
  * ✅ Les applications construites avec React, Vue, Angular, ou tout autre framework JavaScript.
  * ✅ La mise en place d'une validation côté client robuste et typée.

⚠️ **Éviter pour :**

  * Les formulaires très simples où l'overhead de la bibliothèque serait inutile.
  * Les scénarios de performance ultra-critique où une validation native ou manuelle très minimaliste serait préférée (bien que Zod soit déjà très performant).
  * Les projets sans TypeScript, car une grande partie des avantages de typage et de sécurité serait perdue.

## 📊 Comparaison (vs. Validation manuelle, Formik, React Hook Form)

| Fonctionnalité            | AK Zod Form Kit | Formik         | React Hook Form | Validation manuelle |
| :------------------------- | :-------------- | :------------- | :-------------- | :------------------ |
| **Validation Zod Intégrée**| ✅              | ⚠️ (avec yup) | ✅ (avec zodResolver) | ❌                  |
| **Transformation automatique** | ✅ (via `transformations` et Zod) | ❌           | ❌              | ❌                  |
| **Support FormData natif** | ✅              | ❌ (nécessite `Formik-persist` ou équivalent) | ⚠️ (nécessite adapter) | ✅ (natif)          |
| **Framework agnostic** | ✅              | ❌ (principalement React) | ❌ (principalement React) | ✅                  |
| **API simple et unifiée** | ✅              | ⚠️             | ⚠️              | ❌                  |
| **Bundle size** | 📦 Léger (\~10KB gzipped) | 📦 Moyen     | 📦 Léger        | 📦 Aucun            |
| **Typage TypeScript** | ✅ (fort)      | ✅             | ✅              | ❌                  |

## 🚀 Roadmap

Votre avis est précieux pour orienter les futures évolutions \!

  * [ ] v1.1 : Support amélioré des schémas imbriqués complexes et des tableaux d'objets.
  * [ ] v1.2 : Plugins de transformation courants (gestion des dates, monnaie, etc.).
  * [ ] v1.3 : Intégrations officielles avec des librairies de formulaires populaires (Formik, React Hook Form, Final Form) pour des scénarios hybrides.
  * [ ] v1.4 : Gestion native des arrays de fichiers multiples via `FormData`.
  * [ ] v2.0 : Architecture de middleware extensible pour des traitements encore plus personnalisés.

## 🤝 Contribution

Les contributions sont les bienvenues \! N'hésitez pas à proposer des améliorations, des corrections de bugs ou de nouvelles fonctionnalités.

1.  Fork le projet.
2.  Créez une branche pour votre fonctionnalité (`git checkout -b feature/ma-super-feature`).
3.  Commitez vos changements (`git commit -m 'Ajout d'une super fonctionnalité'`).
4.  Poussez vers votre branche (`git push origin feature/ma-super-feature`).
5.  Ouvrez une Pull Request.

### Développement local

```bash
git clone [https://github.com/AndersonKouadio/ak-zod-form-kit.git](https://github.com/AndersonKouadio/ak-zod-form-kit.git)
cd ak-zod-form-kit
npm install

# Lancer les tests
npm test
npm run test:watch
npm run test:coverage

# Compiler le projet
npm run build

# Linter le code (et corriger automatiquement)
npm run lint
npm run lint:fix
```

## 📄 Licence

Ce projet est sous licence [MIT](https://www.google.com/url?sa=E&source=gmail&q=https://github.com/AndersonKouadio/ak-zod-form-kit/blob/main/LICENSE).

## 🙏 Remerciements

  * **[Zod](https://zod.dev/)** pour son excellence en matière de validation TypeScript.
  * **[TypeScript](https://www.typescriptlang.org/)** pour la sécurité et la robustesse des types.
  * La communauté open source pour l'inspiration et les outils.

-----


<div align="center">
Fait avec ❤️ pour les développeurs qui aiment les formulaires typés.
<br>
⭐ Star ce repo • 🐦 Suivre <a href="https://www.google.com/search?q=https://twitter.com/anderson\_k\_dev">sur Twitter</a> (si vous en avez un) • 📖 Lire la doc (ce README !)
</div>