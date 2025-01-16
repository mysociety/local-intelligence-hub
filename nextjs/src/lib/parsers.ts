import { createParser } from 'nuqs'
import * as z from 'zod'

export function createNuqsParserFromZodResolver<
  Output = any,
  Def extends z.ZodTypeDef = z.ZodTypeDef,
  Input = Output,
>(resolver: z.ZodType<Output, Def>) {
  return createParser({
    parse: (v) => resolver.safeParse(v).data,
    serialize: (v) => String(resolver.safeParse(v).data),
  })
}
