import { z } from "zod";
import { processAndValidateFormData } from "../src/processAndValidateFormData";
import { convertObjectToFormData } from "../src/convertObjectToFormData";

describe("processAndValidateFormData", () => {
  const userSchema = z.object({
    name: z.string().min(2, "Name too short"),
    email: z.string().email("Invalid email"),
    age: z.coerce.number().min(18, "Must be adult"),
    terms: z.coerce.boolean(),
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
      formData.append("name", "J");
      formData.append("email", "invalid-email");
      formData.append("age", "15");

      const result = processAndValidateFormData(userSchema, formData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errors.name).toBe("Name too short");
        expect(result.errors.email).toBe("Invalid email");
        expect(result.errors.age).toBe("Must be adult");
        expect(result.errorsInArray).toHaveLength(3);
      }
    });
  });

  describe("with additional data", () => {
    it("should merge additional data", () => {
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
  });

  describe("with transformations", () => {
    it("should apply custom transformations", () => {
      const formData = new FormData();
      formData.append("name", "  John Doe  ");
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
        const data = result.data as {
          name: string;
          email: string;
          age: number;
          terms: boolean;
        };
        expect(data.name).toBe("John Doe");
        expect(data.email).toBe("john@example.com");
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
        expect(result.data).toBeInstanceOf(Object);
        expect(result.data).not.toBeInstanceOf(FormData);
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
      }
    });
  });

  describe("with key transforms", () => {
    it("should transform field names", () => {
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
        const data = result.data as {
          name: string;
          email: string;
          age: number;
          terms: boolean;
        };
        expect(data).toEqual({
          name: "John",
          email: "john@example.com",
          age: 25,
          terms: true,
        });
      }
    });
  });

  describe("with dynamic validation disabled", () => {
    it("should reject unknown fields with strict schema", () => {
      // Utilisons un schéma strict pour ce test
      const strictSchema = userSchema.strict();

      const data = {
        name: "John",
        email: "john@example.com",
        age: 25,
        terms: true,
        unknownField: "value",
      };

      const result = processAndValidateFormData(strictSchema, data, {
        useDynamicValidation: false,
      });

      expect(result.success).toBe(false);
    });

    it("should accept known fields only with dynamic validation disabled", () => {
      const data = {
        name: "John",
        email: "john@example.com",
        age: 25,
        terms: true,
      };

      const result = processAndValidateFormData(userSchema, data, {
        useDynamicValidation: false,
      });

      expect(result.success).toBe(true);
    });
  });
});
