import { CodegenConfig } from '@graphql-codegen/cli'

const config: CodegenConfig = {
  schema: 'http://127.0.0.1:8000/graphql',
  documents: [
    'src/components/**/*.{ts,tsx}',
    'src/app/**/*.{ts,tsx}',
    'src/hooks/**/*.{ts,tsx}',
    'src/lib/**/*.{ts,tsx}',
    'src/data/**/*.{ts,tsx}',
    'src/graphql/**/*.{ts,tsx}',
  ],
  generates: {
    './src/__generated__/': {
      preset: 'client',
      plugins: ['fragment-matcher'],
      presetConfig: {
        gqlTagName: 'gql',
        fragmentMasking: false,
      },
      config: {
        apolloClientVersion: 3,
        useExplicitTyping: true,
      },
    },
    './src/__generated__/zodSchema.ts': {
      // Has to be separate due to a bug in the library. https://the-guild.dev/graphql/codegen/plugins/typescript/typescript-validation-schema#:~:text=see%20example%20directory.-,Notes,-Their%20is%20currently
      // docs: https://the-guild.dev/graphql/codegen/plugins/typescript/typescript-validation-schema
      plugins: ['typescript-validation-schema'],
      config: {
        schema: 'zod',
        importFrom: './graphql',
        // withObjectType: true,
        // typesPrefix: 'GQLGenerated',
        // apolloClientVersion: 3,
        // useExplicitTyping: true,
      },
    },
  },
  ignoreNoDocuments: true,
}

export default config
