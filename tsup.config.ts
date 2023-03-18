/*
 * @Author: {lyz}
 * @Date: 2022-11-23 23:14:36
 * @LastEditors: {lyz}
 * @LastEditTime: 2022-11-23 23:21:48
 * @Description:
 */
import { defineConfig } from "tsup";

export default defineConfig({
  entryPoints: ["src/index.ts"],
  bundle: true,
  splitting: true,
  minify: process.env.NODE_ENV === "production",
  outDir: "dist",
  format: ["cjs", "esm"],
  dts: true,
  shims: true
});
