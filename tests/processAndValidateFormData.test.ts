import { z } from "zod";
import { processAndValidateFormData } from "../src/processAndValidateFormData";
import { convertObjectToFormData } from "../src/convertObjectToFormData"; // Assuming this utility is available

describe("processAndValidateFormData", () => {
  const userSchema = z.object({
    name: z.string().min(2, "Name too short"),
    email: z.string().email("Invalid email"),
    age: z.coerce.number().min(18, "Must be adult"),
    terms: z.coerce.boolean().default(false),
    // Optional field for partial tests
    bio: z.string().optional(),
  });

  describe("with FormData input", () => {
    it("should process and validate valid form data", () => {
      const formData = new FormData();
      formData.append("name", "John Doe");
      formData.append("email", "john@example.com");
      formData.append("age", "25");
      formData.append("terms", "true");

      const result = processAndValidateFormData(userSchema, formData);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual({
          name: "John Doe",
          email: "john@example.com",
          age: 25,
          terms: true,
        });
      }
    });

    it("should return errors for invalid data", () => {
      const formData = new FormData();
      formData.append("name", "J"); // Too short
      formData.append("email", "invalid-email"); // Invalid format
      formData.append("age", "15"); // Too young
      formData.append("terms", "false");

      const result = processAndValidateFormData(userSchema, formData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errors.name).toBe("Name too short");
        expect(result.errors.email).toBe("Invalid email");
        expect(result.errors.age).toBe("Must be adult");
        expect(result.errorsInArray).toHaveLength(3);
        expect(result.errorsInString).toContain("Name too short");
        expect(result.errorsInString).toContain("Invalid email");
        expect(result.errorsInString).toContain("Must be adult");
      }
    });

    it("should handle missing optional fields correctly", () => {
      const formData = new FormData();
      formData.append("name", "Alice");
      formData.append("email", "alice@example.com");
      formData.append("age", "30");
      // 'terms' is missing, should default to false

      const result = processAndValidateFormData(userSchema, formData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual({
          name: "Alice",
          email: "alice@example.com",
          age: 30,
          terms: false, // Default value applied
        });
      }
    });
  });

  describe("with Record<string, unknown> input", () => {
    it("should process and validate valid object data", () => {
      const data = {
        name: "Peter",
        email: "peter@example.com",
        age: 40,
        terms: true,
      };

      const result = processAndValidateFormData(userSchema, data);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(data);
      }
    });

    it("should return errors for invalid object data", () => {
      const data = {
        name: "P",
        email: "peter",
        age: 10,
      };

      const result = processAndValidateFormData(userSchema, data);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errors.name).toBe("Name too short");
        expect(result.errors.email).toBe("Invalid email");
        expect(result.errors.age).toBe("Must be adult");
      }
    });
  });

  describe("with additional data", () => {
    it("should merge additional data and validate combined result", () => {
      const formData = new FormData();
      formData.append("name", "John");
      formData.append("email", "john@example.com");

      const result = processAndValidateFormData(userSchema, formData, {
        additionalData: {
          age: 25,
          terms: true,
        },
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual({
          name: "John",
          email: "john@example.com",
          age: 25,
          terms: true,
        });
      }
    });

    it("should allow additional data to override form data", () => {
      const formData = new FormData();
      formData.append("name", "Form Name");
      formData.append("email", "form@example.com");
      formData.append("age", "10"); // Invalid age from form

      const result = processAndValidateFormData(userSchema, formData, {
        additionalData: {
          name: "Additional Name", // This should override
          age: 30, // This should override and make valid
          terms: true,
        },
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual({
          name: "Additional Name",
          email: "form@example.com",
          age: 30,
          terms: true,
        });
      }
    });
  });

  describe("with transformations", () => {
    it("should apply custom transformations before validation", () => {
      const formData = new FormData();
      formData.append("name", "   John Doe   ");
      formData.append("email", "JOHN@EXAMPLE.COM");
      formData.append("age", "25");
      formData.append("terms", "true");

      const result = processAndValidateFormData(userSchema, formData, {
        transformations: {
          name: (value: string) => value.trim(),
          email: (value: string) => value.toLowerCase(),
        },
      });

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as z.infer<typeof userSchema>;
        expect(data.name).toBe("John Doe");
        expect(data.email).toBe("john@example.com");
      }
    });

    it("should apply transformations to additional data as well", () => {
      const result = processAndValidateFormData(userSchema, {}, {
        additionalData: {
          name: "   TEST   ",
          email: "TEST@EXAMPLE.COM",
          age: 20,
          terms: false,
        },
        transformations: {
          name: (value: string) => value.trim(),
          email: (value: string) => value.toLowerCase(),
        },
      });

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as z.infer<typeof userSchema>;
        expect(data.name).toBe("TEST");
        expect(data.email).toBe("test@example.com");
      }
    });
  });

  describe("output formats", () => {
    it("should return object by default", () => {
      const formData = convertObjectToFormData({
        name: "John",
        email: "john@example.com",
        age: "25",
        terms: "true",
      });

      const result = processAndValidateFormData(userSchema, formData);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(typeof result.data).toBe("object");
        expect(result.data).not.toBeInstanceOf(FormData);
        expect(result.data).toEqual({ name: "John", email: "john@example.com", age: 25, terms: true });
      }
    });

    it("should return FormData when specified", () => {
      const formData = convertObjectToFormData({
        name: "John",
        email: "john@example.com",
        age: "25",
        terms: "true",
      });

      const result = processAndValidateFormData(userSchema, formData, {
        outputFormat: "formData",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBeInstanceOf(FormData);
        const outputFormData = result.data as FormData;
        expect(outputFormData.get("name")).toBe("John");
        expect(outputFormData.get("email")).toBe("john@example.com");
        expect(outputFormData.get("age")).toBe("25"); // FormData stores numbers as strings
        expect(outputFormData.get("terms")).toBe("true"); // FormData stores booleans as strings
      }
    });
  });

  describe("with key transforms", () => {
    it("should transform field names before validation", () => {
      const formData = convertObjectToFormData({
        user_name: "John",
        user_email: "john@example.com",
        user_age: "25",
        accept_terms: "true",
      });

      const result = processAndValidateFormData(userSchema, formData, {
        keyTransforms: {
          user_name: "name",
          user_email: "email",
          user_age: "age",
          accept_terms: "terms",
        },
      });

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as z.infer<typeof userSchema>;
        expect(data).toEqual({
          name: "John",
          email: "john@example.com",
          age: 25,
          terms: true,
        });
      }
    });
  });

  describe("with include/exclude fields", () => {
    it("should exclude specified fields", () => {
      const formData = convertObjectToFormData({
        name: "Exclude Me",
        email: "exclude@example.com",
        age: 20,
        password: "secret", // Should be excluded
        _csrf: "token", // Should be excluded
      });

      const result = processAndValidateFormData(userSchema, formData, {
        excludeFields: ["password", "_csrf"],
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual({
          name: "Exclude Me",
          email: "exclude@example.com",
          age: 20,
          terms: false, // Default
        });
        expect(result.data).not.toHaveProperty("password");
        expect(result.data).not.toHaveProperty("_csrf");
      }
    });

    it("should include only specified fields", () => {
      const formData = convertObjectToFormData({
        name: "Include Me",
        email: "include@example.com",
        age: "25",
        extra_field: "should not be included",
      });

      const result = processAndValidateFormData(userSchema, formData, {
        includeFields: ["name", "email"],
      });

      // Correction: le test devrait échouer car age est manquant et requis
      expect(result.success).toBe(false);
      if (!result.success) {
        // Correction: le message d'erreur réel pour un champ manquant avec z.coerce.number()
        expect(result.errors.age).toContain("Invalid input: expected number, received NaN");
        expect(result.data).toEqual({ name: "Include Me", email: "include@example.com" });
        expect(result.data).not.toHaveProperty("extra_field");
      }

      // Test a successful include where all included fields are valid
      const result2 = processAndValidateFormData(z.object({ name: z.string() }), formData, {
        includeFields: ["name"],
      });
      expect(result2.success).toBe(true);
      if (result2.success) {
        expect(result2.data).toEqual({ name: "Include Me" });
      }
    });

    it("should prioritize excludeFields over includeFields", () => {
      const formData = convertObjectToFormData({
        name: "Prioritize",
        email: "prioritize@example.com",
        age: "30",
        secret: "value",
      });

      const result = processAndValidateFormData(userSchema, formData, {
        includeFields: ["name", "email", "secret"],
        excludeFields: ["secret"],
      });

      // Correction: le test devrait échouer car age est exclu implicitement par includeFields
      // mais est requis par le schéma
      expect(result.success).toBe(false);
      if (!result.success) {
        // age est manquant car non inclus dans includeFields
        expect(result.errors.age).toContain("Invalid input: expected number, received NaN");
        expect(result.data).toEqual({
          name: "Prioritize",
          email: "prioritize@example.com",
        });
        expect(result.data).not.toHaveProperty("secret");
      }
    });
  });

  describe("Validation Strategies", () => {
    const extendedUserSchema = userSchema.extend({
      role: z.string().optional(),
    });

    it("should reject extra fields with 'strict' strategy (default)", () => {
      const data = {
        name: "Strict User",
        email: "strict@example.com",
        age: 25,
        terms: true,
        extra: "field",
      };
      const result = processAndValidateFormData(extendedUserSchema, data, {
        validationStrategy: "strict",
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        // Correction: vérifier que l'erreur existe avant de vérifier son contenu
        expect(result.errorsInArray.some((e) => e.message.includes("Unrecognized key"))).toBe(true);
      }
    });

    it("should allow extra fields with 'allowExtraFields' strategy", () => {
      const data = {
        name: "Allow User",
        email: "allow@example.com",
        age: 30,
        terms: true,
        extra: "field",
        customId: 123,
      };
      const result = processAndValidateFormData(extendedUserSchema, data, {
        validationStrategy: "allowExtraFields",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual({ ...data, bio: undefined }); // bio is optional, will be undefined if not present
      }
    });

    it("should remove extra fields with 'removeExtraFields' strategy", () => {
      const data = {
        name: "Remove User",
        email: "remove@example.com",
        age: 35,
        terms: true,
        extra: "field",
        customId: 456,
      };
      const result = processAndValidateFormData(extendedUserSchema, data, {
        validationStrategy: "removeExtraFields",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual({
          name: "Remove User",
          email: "remove@example.com",
          age: 35,
          terms: true,
          bio: undefined,
        });
        expect(result.data).not.toHaveProperty("extra");
        expect(result.data).not.toHaveProperty("customId");
      }
    });

    it("should make fields optional but reject extras with 'partial-strict' strategy", () => {
      const data = {
        email: "partialstrict@example.com", // name and age are optional now
        extra: "field", // Should be rejected
      };
      const result = processAndValidateFormData(extendedUserSchema, data, {
        validationStrategy: "partial-strict",
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        // Correction: vérifier que l'erreur existe avant de vérifier son contenu
        expect(result.errorsInArray.some((e) => e.message.includes("Unrecognized key"))).toBe(true);
      }

      const validPartialData = { bio: "My bio" };
      const result2 = processAndValidateFormData(extendedUserSchema, validPartialData, {
        validationStrategy: "partial-strict",
      });
      expect(result2.success).toBe(true);
      if (result2.success) {
        expect(result2.data).toEqual({ bio: "My bio", terms: false });
      }
    });

    it("should make fields optional and allow extras with 'partial' strategy", () => {
      const data = {
        name: "Partial User", // email and age are optional
        extra: "field", // Should be allowed
      };
      const result = processAndValidateFormData(extendedUserSchema, data, {
        validationStrategy: "partial",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual({ name: "Partial User", extra: "field", terms: false, bio: undefined });
      }
    });
  });

  describe("Schema Modifications", () => {
    const addressSchema = z.object({
      street: z.string().min(5),
      city: z.string(),
      zip: z.string().regex(/^\d{5}$/, "Invalid zip code"),
    });

    const contactSchema = z.object({
      phone: z.string().optional(),
      twitter: z.string().startsWith("@").optional(),
    });

    it("should merge schemas with 'mergeWithAnd' logic", () => {
      const data = {
        name: "Merge User",
        email: "merge@example.com",
        age: 20,
        terms: true,
        street: "123 Main St",
        city: "Anytown",
        zip: "12345",
        phone: "555-1234",
      };

      const result = processAndValidateFormData(userSchema, data, {
        schemaModification: "mergeWithAnd",
        additionalSchemas: [addressSchema, contactSchema],
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual({
          name: "Merge User",
          email: "merge@example.com",
          age: 20,
          terms: true,
          bio: undefined,
          street: "123 Main St",
          city: "Anytown",
          zip: "12345",
          phone: "555-1234",
          twitter: undefined,
        });
      }
    });

    it("should fail 'mergeWithAnd' if a required field from any schema is missing", () => {
      const data = {
        name: "Merge User",
        email: "merge@example.com",
        age: 20,
        terms: true,
        street: "123 Main St",
        zip: "12345",
        // city is missing
      };

      const result = processAndValidateFormData(userSchema, data, {
        schemaModification: "mergeWithAnd",
        additionalSchemas: [addressSchema],
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errors.city).toBeDefined();
      }
    });

    const articleSchema = z.object({
      type: z.literal("article"),
      title: z.string(),
      content: z.string(),
    });

    const videoSchema = z.object({
      type: z.literal("video"),
      url: z.string().url(),
      duration: z.number().positive(),
    });

    it("should create a union with 'mergeWithOr' logic (article)", () => {
      const data = {
        type: "article",
        title: "My Great Article",
        content: "This is the content.",
      };

      const result = processAndValidateFormData(articleSchema, data, {
        schemaModification: "mergeWithOr",
        additionalSchemas: [videoSchema],
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(data);
      }
    });

    it("should create a union with 'mergeWithOr' logic (video)", () => {
      const data = {
        type: "video",
        url: "https://example.com/video.mp4",
        duration: 120,
      };

      const result = processAndValidateFormData(articleSchema, data, {
        schemaModification: "mergeWithOr",
        additionalSchemas: [videoSchema],
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(data);
      }
    });

    it("should fail 'mergeWithOr' if data does not match any schema in the union", () => {
      const data = {
        type: "unknown",
        id: "123",
      };

      const result = processAndValidateFormData(articleSchema, data, {
        schemaModification: "mergeWithOr",
        additionalSchemas: [videoSchema],
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        // Correction: vérifier que l'erreur existe et contient un message d'erreur valide
        expect(result.errorsInArray.some((e) => e.message.includes("Invalid"))).toBe(true);
      }
    });
  });

  describe("Edge Cases and Combinations", () => {
    it("should handle empty options gracefully", () => {
      const formData = convertObjectToFormData({
        name: "Test",
        email: "test@example.com",
        age: "20",
        terms: "true",
      });
      const result = processAndValidateFormData(userSchema, formData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual({ name: "Test", email: "test@example.com", age: 20, terms: true });
      }
    });

    it("should handle null/undefined values in input (Zod coerce should handle)", () => {
      const data = {
        name: "Null Test",
        email: "null@example.com",
        age: null, // Should be coerced to 0 if min(0) allows it, or fail if not coercible
        terms: undefined, // Should default to false
      };
      const result = processAndValidateFormData(userSchema, data);
      expect(result.success).toBe(false); // age: null cannot be coerced to a number >= 18
      if (!result.success) {
        // Correction: le message d'erreur réel quand z.coerce.number() reçoit null et échoue la validation min(18)
        expect(result.errors.age).toBe("Must be adult");
      }

      // Test with a schema that allows null for age
      const lenientSchema = z.object({
        name: z.string(),
        age: z.number().nullable().default(0),
      });
      const lenientResult = processAndValidateFormData(lenientSchema, { name: "Lenient", age: null });
      expect(lenientResult.success).toBe(true);
      if (lenientResult.success) {
        expect(lenientResult.data).toEqual({ name: "Lenient", age: null });
      }
    });

    it("should combine keyTransforms, transformations, and additionalData", () => {
      const formData = new FormData();
      formData.append("user_name_input", "   COMBO USER   ");
      formData.append("user_email_address", "COMBO@EXAMPLE.COM");
      formData.append("user_age_field", "22");
      formData.append("accept_terms_checkbox", "true");
      formData.append("extra_form_field", "should be removed");

      const result = processAndValidateFormData(userSchema, formData, {
        keyTransforms: {
          user_name_input: "name",
          user_email_address: "email",
          user_age_field: "age",
          accept_terms_checkbox: "terms",
        },
        transformations: {
          name: (value: string) => (typeof value === 'string' ? value.trim() : value),
          email: (value: string) => (typeof value === 'string' ? value.toLowerCase() : value),
        },
        additionalData: {
          bio: "This is an additional bio.",
        },
        validationStrategy: "removeExtraFields", // Remove 'extra_form_field'
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual({
          name: "COMBO USER",
          email: "combo@example.com",
          age: 22,
          terms: true,
          bio: "This is an additional bio.",
        });
        expect(result.data).not.toHaveProperty("extra_form_field");
      }
    });
  });
});