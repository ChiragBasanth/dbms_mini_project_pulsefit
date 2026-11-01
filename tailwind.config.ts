import type { Config } from "tailwindcss";
const config: Config = { content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"], theme: { extend: { colors: { ink: "#08111f", panel: "#101c2d", lime: "#c5f467" } } }, plugins: [] };
export default config;
