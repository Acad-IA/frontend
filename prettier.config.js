// @ts-check

/** @type {import('prettier').Config} */
const config = {
  semi: false,
  singleQuote: true,
  trailingComma: 'all',
  plugins: ['prettier-plugin-tailwindcss'],
  tailwindFunctions: ['clsx', 'cn', 'cva'],
  endOfLine: 'lf',
}

export default config
