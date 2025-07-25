import { z } from 'zod';
import 'jest-environment-jsdom';
import { processAndValidateFormData } from '../src/processAndValidateFormData';
import { convertObjectToFormData } from '../src/convertObjectToFormData';

describe('Integration Tests', () => {
  describe("Real-world form scenarios", () => {
    it("should handle user registration form", () => {
      const registrationSchema = z
        .object({
          username: z.string().min(3).max(20),
          email: z.string().email(),
          password: z.string().min(8),
          confirmPassword: z.string(),
          firstName: z.string().min(1),
          lastName: z.string().min(1),
          dateOfBirth: z.coerce.date(),
          newsletter: z.coerce.boolean().default(false),
          source: z.enum(["web", "mobile", "api"]).default("web"),
        })
        .refine((data) => data.password === data.confirmPassword, {
          message: "Passwords don't match",
          path: ["confirmPassword"],
        });

      const formData = convertObjectToFormData({
        username: "johndoe",
        email: "john@example.com",
        password: "secretpassword",
        confirmPassword: "secretpassword",
        firstName: "John",
        lastName: "Doe",
        dateOfBirth: "1990-01-01",
        newsletter: "true",
      });

      const result = processAndValidateFormData(registrationSchema, formData, {
        additionalData: { source: "web" as const },
      });

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as {
          username: string;
          dateOfBirth: Date;
          newsletter: boolean;
          source: string;
        };
        expect(data.username).toBe("johndoe");
        expect(data.dateOfBirth).toBeInstanceOf(Date);
        expect(data.newsletter).toBe(true);
        expect(data.source).toBe("web");
      }
    });

    it("should handle file upload with metadata", () => {
      const uploadSchema = z.object({
        title: z.string().min(1),
        description: z.string().optional(),
        file: z.instanceof(File),
        category: z.enum(["image", "document", "video"]),
        isPublic: z.coerce.boolean(),
        tags: z.array(z.string()).default([]),
      });

      const file = new global.File(["content"], "test.txt", {
        type: "text/plain",
      });
      const formData = new FormData();
      formData.append("title", "My Document");
      formData.append("description", "A test document");
      formData.append("file", file);
      formData.append("category", "document");
      formData.append("isPublic", "false");
      formData.append("tags", "tag1,tag2,tag3");

      const result = processAndValidateFormData(uploadSchema, formData, {
        transformations: {
          tags: (value) =>
            String(value)
              .split(",")
              .map((tag: string) => tag.trim()),
        },
        outputFormat: "formData",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBeInstanceOf(FormData);
        const resultFormData = result.data as FormData;
        expect(resultFormData.get("title")).toBe("My Document");
        // Fix: Comparer les propriétés du File plutôt que l'objet direct
        const retrievedFile = resultFormData.get("file") as File;
        expect(retrievedFile.name).toBe(file.name);
        expect(retrievedFile.type).toBe(file.type);
      }
    });
  });
});
