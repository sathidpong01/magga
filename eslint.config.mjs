import nextConfig from "eslint-config-next/core-web-vitals";

const eslintConfig = [
  {
    ignores: [
      "**/node_modules/",
      ".next/",
      "out/",
      "coverage/",
      "scripts/",
      "check_credits.ts",
      "dump_schema.ts",
      ".*/**/*",
    ],
  },
  ...nextConfig,
  {
    rules: {
      "react-hooks/error-boundaries": "off",
      "react-hooks/purity": "off",
      "react-hooks/refs": "off",
      "react-hooks/set-state-in-effect": "off",
      "react/no-unescaped-entities": "off",
    },
  },
];

export default eslintConfig;
