module.exports = {
  env: {
    node: true
  },
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "prettier",
    "plugin:prettier/recommended"
  ],
  parser: "@typescript-eslint/parser",
  parserOptions: {
    ecmaFeatures: {
      jsx: true
    },
    ecmaVersion: "latest",
    sourceType: "module"
  },
  plugins: ["@typescript-eslint", "prettier"],
  rules: {
    "prettier/prettier": "error",
    semi: ["error", "always"],
    "@typescript-eslint/no-non-null-assertion": "off",
    "@typescript-eslint/no-var-requires": 0,
    "padding-line-between-statements": [
      "warn",
      // if 前后 空行
      { blankLine: "always", prev: "*", next: "block-like" },
      { blankLine: "always", prev: "block-like", next: "*" },
      // 函数前面必须空行
      { blankLine: "always", prev: "*", next: "function" },
      // 表达式之前 之间 之后，必须空一行
      { blankLine: "always", prev: "expression", next: "expression" },
      { blankLine: "always", prev: "*", next: "expression" },
      { blankLine: "always", prev: "expression", next: "*" },
      // 引入和const中间要有空行
      { blankLine: "always", prev: "import", next: "const" },
      // return 前 必须空一行
      { blankLine: "always", prev: "*", next: "return" }
    ]
  }
};
