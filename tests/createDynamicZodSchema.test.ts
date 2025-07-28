import { z } from "zod";
import { createDynamicZodSchema } from "../src/createDynamicZodSchema"; // Adjust path as needed

describe("createDynamicZodSchema", () => {
  const baseSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Invalid email format"),
    age: z.number().min(0, "Age cannot be negative"),
    isActive: z.boolean().default(false),
  });

  // Test for default 'strict' behavior
  it("should create a strict schema by default, rejecting unknown fields", () => {
    const data = {
      name: "John",
      email: "john@example.com",
      age: 30,
      extraField: "some value", // This should be rejected
    };

    const dynamicSchema = createDynamicZodSchema(baseSchema, data); // Default strategy is 'strict'
    const result = dynamicSchema.safeParse(data);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues).toHaveLength(1);
      // Correction: utiliser le message d'erreur réel de Zod
      expect(result.error.issues[0].message).toContain("Unrecognized key");
      expect(result.error.issues[0].message).toContain("extraField");
    }
  });

  it("should create schema for existing fields only (strict default)", () => {
    const data = {
      name: "John",
      email: "john@example.com",
      age: 30,
    };

    const dynamicSchema = createDynamicZodSchema(baseSchema, data);
    const result = dynamicSchema.safeParse(data);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual({ ...data, isActive: false }); // Default value should be applied
    }
  });

  it("should validate known fields according to base schema (strict default)", () => {
    const invalidData = {
      name: "J", // Too short
      email: "invalid-email", // Invalid format
      age: -5, // Negative age
    };

    const dynamicSchema = createDynamicZodSchema(baseSchema, invalidData);
    const result = dynamicSchema.safeParse(invalidData);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues).toHaveLength(3); // name, email, and age errors
      expect(result.error.issues.map(issue => issue.path.join('.'))).toEqual(expect.arrayContaining(['name', 'email', 'age']));
    }
  });

  it("should work with empty data (strict default)", () => {
    const data = {}; // Missing required fields

    const dynamicSchema = createDynamicZodSchema(baseSchema, data);
    const result = dynamicSchema.safeParse(data);

    expect(result.success).toBe(false); // Should fail due to missing required fields
    if (!result.success) {
      expect(result.error.issues).toHaveLength(3); // name, email, age are required
      expect(result.error.issues.map(issue => issue.path.join('.'))).toEqual(expect.arrayContaining(['name', 'email', 'age']));
    }
  });

  // --- Validation Strategy Tests ---

  describe("Validation Strategy: 'allowExtraFields'", () => {
    it("should allow and include extra fields", () => {
      const data = {
        name: "Jane",
        email: "jane@example.com",
        age: 28,
        extraField: "allowed value",
        anotherExtra: 456,
      };

      const dynamicSchema = createDynamicZodSchema(baseSchema, data, "allowExtraFields");
      const result = dynamicSchema.safeParse(data);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual({ ...data, isActive: false }); // Default value should be applied
      }
    });

    it("should still validate known fields when allowing extra fields", () => {
      const invalidData = {
        name: "J", // Too short
        email: "invalid", // Invalid email
        extraField: "allowed",
      };

      const dynamicSchema = createDynamicZodSchema(baseSchema, invalidData, "allowExtraFields");
      const result = dynamicSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues).toHaveLength(3); // name, email, age (missing)
        expect(result.error.issues.map(issue => issue.path.join('.'))).toEqual(expect.arrayContaining(['name', 'email', 'age']));
      }
    });
  });

  describe("Validation Strategy: 'removeExtraFields'", () => {
    it("should remove extra fields silently", () => {
      const data = {
        name: "Bob",
        email: "bob@example.com",
        age: 40,
        extraField: "should be removed",
        anotherExtra: 789,
      };

      const dynamicSchema = createDynamicZodSchema(baseSchema, data, "removeExtraFields");
      const result = dynamicSchema.safeParse(data);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual({
          name: "Bob",
          email: "bob@example.com",
          age: 40,
          isActive: false, // Default value applied
        });
        expect(result.data).not.toHaveProperty("extraField");
        expect(result.data).not.toHaveProperty("anotherExtra");
      }
    });
  });

  describe("Validation Strategy: 'partial-strict'", () => {
    it("should make base schema fields optional but reject extra fields", () => {
      const data = {
        name: "Charlie", // Only name provided
        extraField: "should be rejected",
      };

      const dynamicSchema = createDynamicZodSchema(baseSchema, data, "partial-strict");
      const result = dynamicSchema.safeParse(data);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues).toHaveLength(1); // Only extraField should cause error
        // Correction: utiliser le message d'erreur réel de Zod
        expect(result.error.issues[0].message).toContain("Unrecognized key");
        expect(result.error.issues[0].message).toContain("extraField");
      }

      const partialValidData = { email: "charlie@example.com" };
      const partialResult = dynamicSchema.safeParse(partialValidData);
      expect(partialResult.success).toBe(true);
      if (partialResult.success) {
        expect(partialResult.data).toEqual({ email: "charlie@example.com", isActive: false });
      }
    });
  });

  describe("Validation Strategy: 'partial'", () => {
    it("should make base schema fields optional and allow extra fields", () => {
      const data = {
        email: "david@example.com", // Only email provided
        extraField: "allowed extra",
      };

      const dynamicSchema = createDynamicZodSchema(baseSchema, data, "partial");
      const result = dynamicSchema.safeParse(data);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual({ email: "david@example.com", extraField: "allowed extra", isActive: false });
      }
    });
  });

  // --- Schema Modification Tests ---

  describe("Schema Modification: 'mergeWithAnd'", () => {
    const additionalSchema1 = z.object({
      role: z.string().min(3),
    });
    const additionalSchema2 = z.object({
      department: z.string().optional(),
      isAdmin: z.boolean().default(false),
    });

    it("should merge schemas with AND logic", () => {
      const data = {
        name: "Eve",
        email: "eve@example.com",
        age: 35,
        role: "Developer",
        department: "Engineering",
      };

      const dynamicSchema = createDynamicZodSchema(
        baseSchema,
        data,
        "strict",
        "mergeWithAnd",
        [additionalSchema1, additionalSchema2]
      );
      const result = dynamicSchema.safeParse(data);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual({
          name: "Eve",
          email: "eve@example.com",
          age: 35,
          isActive: false, // From baseSchema default
          role: "Developer",
          department: "Engineering",
          isAdmin: false, // From additionalSchema2 default
        });
      }
    });

    it("should fail if a field from any merged schema is missing", () => {
      const data = {
        name: "Frank",
        email: "frank@example.com",
        age: 22,
        // role is missing
      };

      const dynamicSchema = createDynamicZodSchema(
        baseSchema,
        data,
        "strict",
        "mergeWithAnd",
        [additionalSchema1, additionalSchema2]
      );
      const result = dynamicSchema.safeParse(data);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues).toHaveLength(1);
        expect(result.error.issues[0].path[0]).toBe("role");
      }
    });

    it("should handle conflicts in merged schemas (last one wins)", () => {
      const conflictingSchema = z.object({
        email: z.string().url("Must be a URL now"), // Conflicts with baseSchema.email
      });

      const data = {
        name: "Grace",
        email: "not-a-url",
        age: 29,
        role: "Designer",
      };

      const dynamicSchema = createDynamicZodSchema(
        baseSchema,
        data,
        "strict",
        "mergeWithAnd",
        [additionalSchema1, conflictingSchema]
      );
      const result = dynamicSchema.safeParse(data);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues).toHaveLength(1);
        expect(result.error.issues[0].path[0]).toBe("email");
        expect(result.error.issues[0].message).toBe("Must be a URL now");
      }
    });
  });
});