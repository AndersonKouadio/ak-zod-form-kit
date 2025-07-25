import { applyDataTransformations } from "../src/applyDataTransformations";

describe("applyDataTransformations", () => {
  it("should apply transformations to existing fields", () => {
    const data = {
      price: "123.45",
      name: "  John Doe  ",
      isActive: "true",
    };

    const transformations = {
      price: (value: unknown) => parseFloat(String(value)),
      name: (value: unknown) => String(value).trim(),
      isActive: (value: unknown) => String(value) === "true",
    };

    const result = applyDataTransformations(data, transformations);

    expect(result).toEqual({
      price: 123.45,
      name: "John Doe",
      isActive: true,
    });
  });

  it("should ignore transformations for non-existing fields", () => {
    const data = { name: "John" };
    const transformations = {
      name: (value: unknown) => String(value).toUpperCase(),
      nonExisting: (value: unknown) => String(value),
    };

    const result = applyDataTransformations(data, transformations);

    expect(result).toEqual({ name: "JOHN" });
    expect(result).not.toHaveProperty("nonExisting");
  });

  it("should not mutate original data", () => {
    const data = { value: "10" };
    const transformations = {
      value: (value: unknown) => Number(value),
    };

    const result = applyDataTransformations(data, transformations);

    expect(data.value).toBe("10"); // Original unchanged
    expect(result.value).toBe(10); // Result transformed
  });

  it("should handle complex transformations", () => {
    const data = {
      tags: "tag1,tag2,tag3",
      metadata: '{"key": "value"}',
    };

    const transformations = {
      tags: (value: unknown) =>
        String(value)
          .split(",")
          .map((tag) => tag.trim()),
      metadata: (value: unknown) => JSON.parse(String(value)),
    };

    const result = applyDataTransformations(data, transformations);

    expect(result.tags).toEqual(["tag1", "tag2", "tag3"]);
    expect(result.metadata).toEqual({ key: "value" });
  });
});
