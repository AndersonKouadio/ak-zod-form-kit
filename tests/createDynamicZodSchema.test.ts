import { z } from "zod";
import { createDynamicZodSchema } from "../src/createDynamicZodSchema";

describe("createDynamicZodSchema", () => {
  const baseSchema = z.object({
    name: z.string().min(2),
    email: z.string().email(),
    age: z.number().min(0),
  });

  it("should create schema for existing fields only", () => {
    const data = {
      name: "John",
      email: "john@example.com",
    };

    const dynamicSchema = createDynamicZodSchema(baseSchema, data);
    const result = dynamicSchema.safeParse(data);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual(data);
    }
  });

  it("should accept unknown fields", () => {
    const data = {
      name: "John",
      email: "john@example.com",
      extraField: "some value",
      anotherExtra: 123,
    };

    const dynamicSchema = createDynamicZodSchema(baseSchema, data);
    const result = dynamicSchema.safeParse(data);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual(data);
    }
  });

  it("should validate known fields according to base schema", () => {
    const invalidData = {
      name: "J", // Too short
      email: "invalid-email", // Invalid format
      extraField: "allowed",
    };

    const dynamicSchema = createDynamicZodSchema(baseSchema, invalidData);
    const result = dynamicSchema.safeParse(invalidData);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues).toHaveLength(2); // name and email errors
    }
  });

  it("should work with empty data", () => {
    const data = {};

    const dynamicSchema = createDynamicZodSchema(baseSchema, data);
    const result = dynamicSchema.safeParse(data);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual({});
    }
  });
});
