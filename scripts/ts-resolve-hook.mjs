export async function resolve(specifier, context, nextResolve) {
  try {
    return await nextResolve(specifier, context);
  } catch (error) {
    const code =
      typeof error === "object" && error !== null && "code" in error
        ? error.code
        : "";
    const local = specifier.startsWith("./") || specifier.startsWith("../");
    if (
      code === "ERR_MODULE_NOT_FOUND" &&
      local &&
      !specifier.endsWith(".ts")
    ) {
      return nextResolve(`${specifier}.ts`, context);
    }

    throw error;
  }
}
