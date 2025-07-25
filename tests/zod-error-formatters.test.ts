import { z } from "zod";
import {
  formatZodErrorsAsObject,
  formatZodErrorsAsArray,
} from "../src/zod-error-formatters";

describe("Zod Error Formatters", () => {
  const schema = z.object({
    name: z.string().min(2, "Name too short"),
    email: z.string().email("Invalid email"),
    age: z.number().min(18, "Must be adult"),
    nested: z.object({
      field: z.string().min(1, "Nested field required"),
    }),
  });

  describe("formatZodErrorsAsObject", () => {
    it("should return empty object for successful validation", () => {
      const validData = {
        name: "John",
        email: "john@example.com",
        age: 25,
        nested: { field: "value" },
      };

      const result = schema.safeParse(validData);
      const errors = formatZodErrorsAsObject(result);

      expect(errors).toEqual({});
    });

    it("should format validation errors as object", () => {
      const invalidData = {
        name: "J",
        email: "invalid",
        age: 15,
        nested: { field: "" },
      };

      const result = schema.safeParse(invalidData);
      const errors = formatZodErrorsAsObject(result);

      expect(errors).toEqual({
        name: "Name too short",
        email: "Invalid email",
        age: "Must be adult",
        "nested.field": "Nested field required",
      });
    });

    it("should handle missing fields", () => {
      const incompleteData = {
        name: "John",
        // Missing: email, age, nested
      };

      const result = schema.safeParse(incompleteData);
      const errors = formatZodErrorsAsObject(result);

      expect(errors.email).toBeDefined();
      expect(errors.age).toBeDefined();
      // Pour un objet manquant, l'erreur est sur 'nested', pas 'nested.field'
      expect(errors.nested).toBeDefined();
    });

    it("should handle nested validation errors correctly", () => {
      const dataWithInvalidNested = {
        name: "John Doe",
        email: "john@example.com",
        age: 25,
        nested: { field: "" }, // Invalid nested field
      };

      const result = schema.safeParse(dataWithInvalidNested);
      const errors = formatZodErrorsAsObject(result);

      // Maintenant on teste vraiment un champ nested invalide
      expect(errors["nested.field"]).toBe("Nested field required");
    });
  });

  describe("formatZodErrorsAsArray", () => {
    it("should return empty array for successful validation", () => {
      const validData = {
        name: "John",
        email: "john@example.com",
        age: 25,
        nested: { field: "value" },
      };

      const result = schema.safeParse(validData);
      const errors = formatZodErrorsAsArray(result);

      expect(errors).toEqual([]);
    });

    it("should format validation errors as array", () => {
      const invalidData = {
        name: "J",
        email: "invalid",
        age: 15,
        nested: { field: "" },
      };

      const result = schema.safeParse(invalidData);
      const errors = formatZodErrorsAsArray(result);

      expect(errors).toHaveLength(4);
      expect(errors).toEqual(
        expect.arrayContaining([
          { key: "name", message: "Name too short" },
          { key: "email", message: "Invalid email" },
          { key: "age", message: "Must be adult" },
          { key: "nested.field", message: "Nested field required" },
        ])
      );
    });
  });
});
