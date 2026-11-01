import path from "node:path";
// Genuine sentence transformer embeddings. No keyword, random or mock fallback.
export const MODEL = "Xenova/all-MiniLM-L6-v2";
export const DIMENSION = 384;
let extractor: Promise<Awaited<ReturnType<typeof load>>> | undefined;
async function load() {
  const { pipeline, env } = await import("@huggingface/transformers");
  env.cacheDir = path.resolve(process.env.EMBEDDING_CACHE || ".cache/models");
  return pipeline("feature-extraction", MODEL, { dtype: "q8" });
}
export async function embed(text: string): Promise<number[]> {
  if (process.env.EMBEDDING_MODEL && process.env.EMBEDDING_MODEL !== MODEL)
    throw new Error(
      "Unsupported model: reindex and migrate dimensions before changing model",
    );
  extractor ??= load().catch((e) => {
    extractor = undefined;
    throw e;
  });
  const output = await (
    await extractor
  )(text.trim().replace(/\s+/g, " ").toLowerCase(), {
    pooling: "mean",
    normalize: true,
  });
  const values = Array.from(output.data, Number);
  if (values.length !== DIMENSION || values.some((v) => !Number.isFinite(v)))
    throw new Error("Invalid embedding");
  return values;
}
export const vector = (v: number[]) => "[" + v.join(",") + "]";
