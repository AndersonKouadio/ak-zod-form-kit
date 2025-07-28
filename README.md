# 🚀 AK Zod Form Kit

Une librairie TypeScript moderne qui transforme vos formulaires en APIs typées sans effort \! ✨

AK Zod Form Kit simplifie drastiquement le traitement, la transformation et la validation des données de formulaire en utilisant la puissance de **Zod**. Fini les validations manuelles fastidieuses et les casse-têtes de typage – transformez vos données brutes en objets typés et validés en une seule ligne \!

-----

## 🎯 Pourquoi AK Zod Form Kit ?

En tant que développeurs, nous passons une part significative de notre temps à gérer des formulaires et à préparer des données pour nos APIs. Ce processus est souvent répétitif, sujet aux erreurs et peut transformer un simple formulaire en un cauchemar de typage. **AK Zod Form Kit** est né de ce constat pour vous offrir une solution robuste, élégante et amusante.

Imaginez :

  * Vous recevez des données d'un formulaire HTML (`FormData`) avec des noms de champs non standard (`user_first_name`, `email_address_input`).
  * Vous devez nettoyer ces données (trimmer les espaces, mettre en minuscules).
  * Vous avez des champs optionnels, des champs qui doivent être supprimés, ou des champs supplémentaires que votre API peut ignorer.
  * Vous devez fusionner ces données avec des informations de session ou d'autres sources (un `userId`, une date de création).
  * Et bien sûr, tout cela doit être rigoureusement validé selon un schéma précis, avec des messages d'erreur clairs pour l'utilisateur.

**AK Zod Form Kit transforme ce défi en une brise \!**

```typescript
// ❌ Avant : Code verbeux et répétitif, source d'erreurs de typage

function handleForm(formData: FormData) {
  const data: any = {}; // Adieu la sécurité des types !
  const errors: any = {};

  const name = formData.get('name');
  if (!name || String(name).length < 2) {
    errors.name = 'Nom requis (min 2 caractères)';
  }
  data.name = String(name || '').trim(); // Transformation manuelle

  const email = formData.get('email');
  if (!email || !String(email).includes('@')) { // Simplifié pour l'exemple
    errors.email = 'Email invalide';
  }
  data.email = String(email || '').toLowerCase(); // Transformation manuelle

  // ... répéter pour chaque champ 😴 et gérer les erreurs manuellement
  if (Object.keys(errors).length > 0) {
    console.error("Validation failed", errors);
    return;
  }
  console.log("Data ready", data);
}

// ✅ Après : Simple, typé et élégant, avec une API unifiée

import { z } from 'zod';
import { processAndValidateFormData } from 'ak-zod-form-kit'; // Votre package !

const UserSchema = z.object({
  name: z.string().min(2, 'Nom requis (min 2 caractères)'),
  email: z.string().email('Email invalide').transform(v => v.toLowerCase()),
  age: z.coerce.number().min(18, 'Majorité requise'), // z.coerce.number gère '25' -> 25
  termsAccepted: z.coerce.boolean().default(false),
});

function handleSubmit(event: Event) {
  event.preventDefault();
  const formData = new FormData(event.target as HTMLFormElement);

  const result = processAndValidateFormData(UserSchema, formData, {
    // Applique des transformations personnalisées avant la validation Zod
    transformations: { name: (v: unknown) => (typeof v === 'string' ? v.trim() : v) },
    // Fusionne des données qui ne viennent pas du formulaire (ex: ID d'utilisateur, timestamp)
    additionalData: { userId: 'abc-123', timestamp: new Date() },
    // Renomme les champs du formulaire pour correspondre au schéma
    keyTransforms: { 'user_full_name': 'name', 'user_email_address': 'email' },
    // Autorise les champs non définis dans le schéma (ou 'removeExtraFields', 'strict', etc.)
    validationStrategy: 'allowExtraFields',
    // Si vous voulez fusionner avec d'autres schémas (ex: pour valider une union de types)
    // schemaModification: 'mergeWithOr',
    // additionalSchemas: [z.object({ adminId: z.string() })]
  });

  if (result.success) {
    // result.data est 100% typé et prêt pour votre API ! 🎉
    console.log("Données validées et prêtes:", result.data);
    // console.log(result.data.name); // TypeScript sait que c'est un string
    // console.log(result.data.email); // TypeScript sait que c'est un string
    // console.log(result.data.age);   // TypeScript sait que c'est un number
    // await sendToAPI(result.data);
  } else {
    // Erreurs formatées pour votre UI
    console.error("Échec de la validation !");
    console.log("Erreurs par champ:", result.errors);         // { name: "Nom requis...", email: "Email invalide" }
    console.log("Erreurs en tableau:", result.errorsInArray); // [{ key: 'name', message: '...' }]
    console.log("Erreurs en chaîne:", result.errorsInString); // "Nom requis...\nEmail invalide..."
  }
}
```

-----

## 🚀 Installation

```bash
npm install ak-zod-form-kit zod
# ou
yarn add ak-zod-form-kit zod
# ou
pnpm add ak-zod-form-kit zod
```

-----

## ⚡ Démarrage rapide

Commencez à valider vos formulaires en quelques étapes simples :

```typescript
import { z } from 'zod';
import { processAndValidateFormData } from 'ak-zod-form-kit';

// 1️⃣ Définir votre schéma Zod - la source de vérité pour vos données
const ContactSchema = z.object({
  name: z.string().min(2, "Nom requis"),
  email: z.string().email("Email invalide"),
  message: z.string().min(10, "Message trop court"),
  newsletter: z.coerce.boolean().default(false) // Gère 'true'/'false' des checkbox ou '1'/'0'
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
    console.log('Message envoyé !');
  } else {
    // ❌ Erreurs prêtes pour l'affichage dans votre UI
    console.error("Erreurs de validation:", result.errors);
    // setErrors(result.errors); // Ex: pour mettre à jour l'état d'un formulaire React
  }
}

// Exemple d'attachement pour Vanilla JS:
// document.getElementById('my-contact-form').addEventListener('submit', handleSubmit);
```

-----

## 🌟 Fonctionnalités principales

**AK Zod Form Kit** est conçu pour être votre couteau suisse pour la gestion des données de formulaire.

### 🧠 Stratégies de Validation Intelligentes

Contrôlez précisément comment Zod gère les champs non déclarés ou l'optionalité des champs grâce à la `validationStrategy`.

  * **'strict'** (Défaut) : Seuls les champs définis dans votre schéma sont acceptés. Tout champ supplémentaire déclenchera une erreur. Idéal pour des APIs strictes.

    ```typescript
    const StrictSchema = z.object({ id: z.string() });
    // { id: "123", extra: "value" } ➡️ Échec (extra non reconnu)
    ```

  * **'allowExtraFields'** : Accepte tous les champs supplémentaires non définis dans le schéma comme `unknown`. Parfait pour les APIs flexibles ou les formulaires qui peuvent contenir des données inattendues.

    ```typescript
    const AllowExtraSchema = z.object({ id: z.string() });
    // { id: "123", extra: "value" } ➡️ Succès (extra est inclus)
    ```

  * **'removeExtraFields'** : Supprime silencieusement tous les champs non définis dans le schéma. Utile pour nettoyer les données avant l'envoi à une API qui n'attend que des champs spécifiques.

    ```typescript
    const RemoveExtraSchema = z.object({ id: z.string() });
    // { id: "123", extra: "value" } ➡️ Succès (extra est supprimé)
    ```

  * **'partial-strict'** : Rend tous les champs de niveau racine du schéma optionnels, mais rejette tout champ supplémentaire non défini. Idéal pour les mises à jour partielles où la structure des données doit rester contrôlée.

    ```typescript
    const PartialStrictSchema = z.object({ name: z.string(), email: z.string() });
    // { name: "Alice" } ➡️ Succès (email est optionnel)
    // { name: "Alice", extra: "value" } ➡️ Échec (extra non reconnu)
    ```

  * **'partial'** : Rend tous les champs de niveau racine du schéma optionnels et autorise les champs supplémentaires. La stratégie la plus permissive pour les mises à jour partielles.

    ```typescript
    const PartialSchema = z.object({ name: z.string(), email: z.string() });
    // { name: "Alice", extra: "value" } ➡️ Succès (email est optionnel, extra est inclus)
    ```

### 🧩 Modifications Structurelles du Schéma (`schemaModification`)

Adaptez la forme de votre schéma de base en le combinant avec d'autres schémas.

  * **'default'** (Défaut) : Aucune modification. Le schéma de base est utilisé tel quel.

  * **'mergeWithAnd'** : Combine votre schéma de base avec un ou plusieurs `additionalSchemas` en utilisant une logique ET. Les données doivent satisfaire tous les schémas fusionnés. Idéal pour composer des schémas complexes à partir de modules plus petits.

    ```typescript
    const UserBase = z.object({ id: z.string() });
    const UserDetails = z.object({ name: z.string(), email: z.string().email() });
    const UserRole = z.object({ role: z.string() });

    // Le schéma résultant attendra { id, name, email, role }
    const mergedSchema = processAndValidateFormData(UserBase, { /* data */ }, {
      schemaModification: 'mergeWithAnd',
      additionalSchemas: [UserDetails, UserRole]
    });
    ```

  * **'mergeWithOr'** : Crée une union entre votre schéma de base et un ou plusieurs `additionalSchemas` en utilisant une logique OU. Les données doivent satisfaire au moins un des schémas fournis. Parfait pour les champs polymorphiques ou les types de données alternatifs.

    ```typescript
    const ArticleSchema = z.object({ type: z.literal('article'), title: z.string() });
    const VideoSchema = z.object({ type: z.literal('video'), url: z.string().url() });

    // Le schéma résultant validera soit un article, soit une vidéo
    const unionSchema = processAndValidateFormData(ArticleSchema, { /* data */ }, {
      schemaModification: 'mergeWithOr',
      additionalSchemas: [VideoSchema]
    });
    ```

### 🔄 Transformations Puissantes

Appliquez des logiques de transformation complexes à vos données après l'extraction mais avant la validation Zod finale. Cela complète les capacités de `.transform()` et `.coerce` de Zod, vous permettant des manipulations ad-hoc.

```typescript
const MySchema = z.object({
  email: z.string().email(),
  tags: z.array(z.string()),
  price: z.number(),
});

const rawData = {
  email: '    MY_EMAIL@EXAMPLE.COM    ',
  tags: 'tag1, tag2 , tag3',
  price: '123.45'
};

const result = processAndValidateFormData(MySchema, rawData, {
  transformations: {
    email: (value: unknown) => (typeof value === 'string' ? value.toLowerCase().trim() : value), // Nettoyage
    tags: (value: unknown) => (typeof value === 'string' ? value.split(',').map(tag => tag.trim()) : value), // Chaîne à tableau
    price: (value: unknown) => (typeof value === 'string' ? parseFloat(value) : value) // Chaîne à nombre
  }
});

if (result.success) {
  console.log(result.data);
  // { email: 'my_email@example.com', tags: ['tag1', 'tag2', 'tag3'], price: 123.45 }
}
```

### 📎 Support Complet des Fichiers et FormData

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
  // await fetch('/api/upload-document', {
  //   method: 'POST',
  //   body: result.data // Envoyez directement le FormData !
  // });
} else {
  console.error("Erreurs d'upload:", result.errors);
}
```

### 🎛️ Extraction Flexible et Données Additionnelles

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

-----

## 📚 Exemples d'usage

### 🔐 Formulaire d'inscription avancé

Un cas d'usage classique, avec des validations croisées et des transformations.

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
      username: (v: unknown) => (typeof v === 'string' ? v.toLowerCase().trim() : v), // Nettoyage automatique
      email: (v: unknown) => (typeof v === 'string' ? v.toLowerCase() : v) // Email en minuscules
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

### ⚛️ Intégration avec React Hook Form (ou autres)

Zod Form Kit peut travailler de concert avec d'autres librairies de formulaires, bien que souvent il puisse les remplacer pour la logique de validation et transformation. Ici, nous montrons comment l'utiliser pour des transformations ou l'ajout de données après la validation initiale de RHF.

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
      console.log('Formulaire envoyé avec succès !');
    } else {
      // Si des erreurs surviennent à cause de `additionalData` ou `transformations`
      // qui invalideraient le schéma après ces étapes
      Object.entries(finalResult.errors).forEach(([field, message]) => {
        setError(field as any, { message });
      });
      console.error('Erreur lors du traitement final.');
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

Intégrez facilement les erreurs formatées dans votre interface utilisateur pour un feedback instantané.

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
      console.log('Message envoyé avec succès !');
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

-----

## 🔧 API Reference

### `processAndValidateFormData<T extends z.ZodRawShape>(schema: z.ZodObject<T>, inputData: FormData | Record<string, unknown>, options?: FormDataProcessingOptions<T>): ProcessedFormDataResult<T>`

La fonction principale qui orchestre le traitement, la transformation et la validation de vos données.

  * `schema`: Votre **schéma Zod** principal définissant la structure et les règles de validation attendues.
  * `inputData`: Les données brutes à traiter, qui peuvent être un objet `FormData` (directement issu d'un formulaire HTML) ou un objet JavaScript (`Record<string, unknown>`).
  * `options?`: Un objet de configuration optionnel pour personnaliser le pipeline de traitement. Voir `FormDataProcessingOptions` ci-dessous.

Retourne un objet de type `ProcessedFormDataResult<T>`.

### `FormDataProcessingOptions<T extends z.ZodRawShape>`

Étend l'interface `FormDataExtractionOptions`.

  * `validationStrategy?: ValidationStrategy;` (par défaut: `'strict'`)
    La stratégie de validation à utiliser pour contrôler le comportement des champs du schéma dynamique. Détermine comment Zod gère les champs non déclarés (les autorise, les supprime, ou les rejette) et définit l'optionalité des champs. Voir la section "Stratégies de Validation Intelligentes" pour plus de détails.

  * `schemaModification?: SchemaModification;` (par défaut: `'default'`)
    La modification structurelle à appliquer au schéma de base avant toute validation. Permet de combiner le schéma principal avec d'autres schémas via des logiques de fusion (AND) ou d'union (OR). Voir la section "Modifications Structurelles du Schéma" pour plus de détails.

  * `additionalSchemas?: z.ZodTypeAny[];`
    Un tableau de schémas Zod supplémentaires à utiliser en conjonction avec la `schemaModification`. Si `schemaModification` est défini sur `'mergeWithAnd'`, ces schémas seront fusionnés (logique ET) avec le schéma de base. Si c'est `'mergeWithOr'`, une union (logique OU) sera créée entre tous les schémas.

  * `transformations?: { [K in keyof T]?: T[K] extends z.ZodTypeAny ? (value: SchemaFieldType<T[K]>) => SchemaFieldType<T[K]> : never; };`
    Un objet de fonctions de transformation personnalisées à appliquer aux champs après l'extraction mais avant la validation Zod finale. Ces transformations sont utiles pour des logiques spécifiques non gérées par `.transform()` ou `.coerce` de Zod.

  * `outputFormat?: 'object' | 'formData';` (par défaut: `'object'`)
    Spécifie le format des données retournées dans la propriété `data` en cas de succès de la validation. `object` retourne un objet JavaScript typé ; `formData` retourne un objet `FormData`.

  * `additionalData?: Record<string, unknown>;`
    Un objet contenant des données supplémentaires à fusionner avec les données extraites du formulaire. Ces données sont fusionnées avant la validation Zod, permettant de valider un ensemble complet de données (formulaire + ajoutées).

### `FormDataExtractionOptions`

  * `keyTransforms?: Record<string, string>;`
    Un objet de mappage pour renommer les clés des champs extraits. Utile si les noms de vos inputs HTML diffèrent des noms de propriétés de votre schéma. Ex: `{ 'user_email_input': 'email' }`.

  * `excludeFields?: string[];`
    Un tableau de noms de champs à ignorer complètement lors de l'extraction. Ex: `['_csrf_token', 'password_confirm']`.

  * `includeFields?: string[];`
    Un tableau de noms de champs à inclure exclusivement. Si cette option est spécifiée, seuls les champs listés ici seront extraits. `excludeFields` prime si un champ est présent dans les deux listes.

### `ProcessedFormDataResult<T extends z.ZodRawShape>`

Le type de retour de la fonction `processAndValidateFormData`.

**En cas de succès (`success: true`):**

```typescript
{
  success: true;
  data: z.infer<z.ZodObject<T>> | FormData; // Les données validées, typées, soit en objet, soit en FormData
}
```

**En cas d'échec (`success: false`):**

```typescript
{
  success: false;
  data: Record<string, unknown>; // Les données (brutes/transformées) ayant échoué la validation, pour le débogage/affichage
  errors: Record<string, string>; // Erreurs formatées en objet (chemin du champ -> message)
  errorsInArray: { key: string; message: string }[]; // Erreurs formatées en tableau d'objets ({ key: 'champ', message: '...' })
  errorsInString: string; // Erreurs formatées en chaîne de caractères (chaque erreur sur une nouvelle ligne)
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

  * `createDynamicZodSchema<T extends z.ZodRawShape>(baseSchema: z.ZodObject<T>, inputData: Record<string, unknown>, validationStrategy?: ValidationStrategy, schemaModification?: SchemaModification, additionalSchemas?: z.ZodTypeAny[]): z.ZodTypeAny`
    Construit un schéma Zod dynamique basé sur un schéma de base, la structure des données d'entrée, et les stratégies de validation/modification spécifiées.

  * `validateDataWithDynamicSchema<T extends z.ZodRawShape>(baseSchema: z.ZodObject<T>, data: Record<string, unknown>, validationStrategy?: ValidationStrategy, schemaModification?: SchemaModification, additionalSchemas?: z.ZodTypeAny[]): z.ZodSafeParseResult<z.infer<ReturnType<typeof createDynamicZodSchema<T>>>>`
    Valide un objet de données en utilisant un schéma Zod dynamique créé à partir du `baseSchema`, `data` et des options de stratégie/modification.

  * `formatZodErrorsAsObject(validationResult: z.ZodSafeParseResult<any>): { [key: string]: string }`
    Convertit les erreurs détaillées d'un résultat de validation Zod en un objet plat (chemin du champ -\> message).

  * `formatZodErrorsAsArray(validationResult: z.ZodSafeParseResult<any>): { key: string; message: string }[]`
    Convertit les erreurs détaillées d'un résultat de validation Zod en un tableau d'objets (`{ key: string; message: string }`).

-----

## 🎯 Cas d'usage recommandés

**AK Zod Form Kit** est une solution idéale pour :

  * ✅ Les formulaires complexes avec des validations métier spécifiques.
  * ✅ L'upload de fichiers accompagnés de métadonnées.
  * ✅ La gestion des APIs hybrides nécessitant à la fois du JSON et du `multipart/form-data`.
  * ✅ La transformation de données brutes avant leur envoi à un backend.
  * ✅ Les applications construites avec React, Vue, Angular, ou tout autre framework JavaScript.
  * ✅ La mise en place d'une validation côté client robuste et typée.
  * ✅ Les scénarios d'intégration de données où les formats d'entrée peuvent varier ou nécessitent un nettoyage.

**⚠️ Éviter pour :**

  * Les formulaires très simples où l'overhead de la bibliothèque serait inutile.
  * Les scénarios de performance ultra-critique où une validation native ou manuelle très minimaliste serait préférée (bien que Zod soit déjà très performant).
  * Les projets sans TypeScript, car une grande partie des avantages de typage et de sécurité serait perdue.

-----

## 📊 Comparaison (vs. Validation manuelle, Formik, React Hook Form)

| Fonctionnalité             | AK Zod Form Kit       | Formik                     | React Hook Form            | Validation manuelle       |
| :------------------------- | :-------------------- | :------------------------- | :------------------------- | :------------------------ |
| Validation Zod Intégrée    | ✅                    | ⚠️ (avec yup)              | ✅ (avec zodResolver)      | ❌                        |
| Transformation automatique | ✅ (via transformations et Zod) | ❌                         | ❌                         | ❌                        |
| Support FormData natif     | ✅                    | ❌ (nécessite Formik-persist ou équivalent) | ⚠️ (nécessite adapter)     | ✅ (natif)                |
| Framework agnostic         | ✅                    | ❌ (principalement React)  | ❌ (principalement React)  | ✅                        |
| API simple et unifiée      | ✅                    | ⚠️                         | ⚠️                         | ❌                        |
| Bundle size                | 📦 Léger (\~10KB gzipped) | 📦 Moyen                   | 📦 Léger                   | 📦 Aucun                  |
| Typage TypeScript          | ✅ (fort)             | ✅                         | ✅                         | ❌                        |

-----

## 🚀 Roadmap

Votre avis est précieux pour orienter les futures évolutions \!

  * [ ] v1.1 : Support amélioré des schémas imbriqués complexes et des tableaux d'objets.
  * [ ] v1.2 : Plugins de transformation courants (gestion des dates, monnaie, etc.).
  * [ ] v1.3 : Intégrations officielles avec des librairies de formulaires populaires (Formik, React Hook Form, Final Form) pour des scénarios hybrides.
  * [ ] v1.4 : Gestion native des arrays de fichiers multiples via `FormData`.
  * [ ] v2.0 : Architecture de middleware extensible pour des traitements encore plus personnalisés.

-----

## 🤝 Contribution

Les contributions sont les bienvenues \! N'hésitez pas à proposer des améliorations, des corrections de bugs ou de nouvelles fonctionnalités.

1.  Fork le projet.
2.  Créez une branche pour votre fonctionnalité (`git checkout -b feature/ma-super-feature`).
3.  Commitez vos changements (`git commit -m 'Ajout d'une super fonctionnalité'`).
4.  Poussez vers votre branche (`git push origin feature/ma-super-feature`).
5.  Ouvrez une Pull Request.

### Développement local

```bash
git clone https://github.com/AndersonKouadio/ak-zod-form-kit.git
cd ak-zod-form-kit
npm install
```

**\# Lancer les tests**

```bash
npm test
npm run test:watch
npm run test:coverage
```

**\# Compiler le projet**

```bash
npm run build
```

**\# Linter le code (et corriger automatiquement)**

```bash
npm run lint
npm run lint:fix
```

-----

## 📄 Licence

Ce projet est sous licence MIT.

-----

## 🙏 Remerciements

  * **Zod** pour son excellence en matière de validation TypeScript.
  * **TypeScript** pour la sécurité et la robustesse des types.
  * La communauté open source pour l'inspiration et les outils.

\<div align="center"\>
Fait avec ❤️ pour les développeurs qui aiment les formulaires typés. \<br\>
⭐ Star ce repo • 🐦 Suivre \<a href="[https://x.com/andy\_jojo01](https://x.com/andy_jojo01)"\>sur X\</a\> • 📖 Lire la doc (ce README \!)
\</div\>