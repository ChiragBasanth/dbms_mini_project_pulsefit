import type { NextConfig } from "next";
const config: NextConfig = {
  serverExternalPackages: [
    "pg",
    "mongodb",
    "@huggingface/transformers",
    "onnxruntime-node",
  ],
  poweredByHeader: false,
};
export default config;
