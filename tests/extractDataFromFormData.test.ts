import { extractDataFromFormData } from "../src/extractDataFromFormData";

describe("extractDataFromFormData", () => {
  describe("with FormData input", () => {
    it("should extract simple form data", () => {
      const formData = new FormData();
      formData.append("name", "John Doe");
      formData.append("email", "john@example.com");
      formData.append("age", "30");

      const result = extractDataFromFormData(formData);

      expect(result).toEqual({
        name: "John Doe",
        email: "john@example.com",
        age: "30",
      });
    });

    it("should handle multiple values for same key", () => {
      const formData = new FormData();
      formData.append("tags", "tag1");
      formData.append("tags", "tag2");
      formData.append("tags", "tag3");
      formData.append("name", "John");

      const result = extractDataFromFormData(formData);

      expect(result.tags).toEqual(["tag1", "tag2", "tag3"]);
      expect(result.name).toBe("John");
    });

    it("should apply key transforms", () => {
      const formData = new FormData();
      formData.append("user_name", "John");
      formData.append("user_email", "john@example.com");

      const result = extractDataFromFormData(formData, {
        keyTransforms: {
          user_name: "name",
          user_email: "email",
        },
      });

      expect(result).toEqual({
        name: "John",
        email: "john@example.com",
      });
    });

    it("should exclude specified fields", () => {
      const formData = new FormData();
      formData.append("name", "John");
      formData.append("password", "secret");
      formData.append("_csrf", "token");

      const result = extractDataFromFormData(formData, {
        excludeFields: ["password", "_csrf"],
      });

      expect(result).toEqual({ name: "John" });
    });

    it("should include only specified fields", () => {
      const formData = new FormData();
      formData.append("name", "John");
      formData.append("email", "john@example.com");
      formData.append("password", "secret");

      const result = extractDataFromFormData(formData, {
        includeFields: ["name", "email"],
      });

      expect(result).toEqual({
        name: "John",
        email: "john@example.com",
      });
    });
  });

  describe("with Object input", () => {
    it("should extract from regular object", () => {
      const obj = {
        name: "John",
        email: "john@example.com",
        age: 30,
      };

      const result = extractDataFromFormData(obj);

      expect(result).toEqual(obj);
    });

    it("should apply transformations to object", () => {
      const obj = {
        user_name: "John",
        user_email: "john@example.com",
        password: "secret",
      };

      const result = extractDataFromFormData(obj, {
        keyTransforms: { user_name: "name", user_email: "email" },
        excludeFields: ["password"],
      });

      expect(result).toEqual({
        name: "John",
        email: "john@example.com",
      });
    });
  });
});
