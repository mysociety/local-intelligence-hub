import { FieldMergeFunction } from '@apollo/client'
import { KeyArgsFunction } from '@apollo/client/cache/inmemory/policies'
import { omit } from 'lodash'

export function resolverKeyWithoutArguments(argsToOmit: Array<string> = []) {
  const keyArgs: KeyArgsFunction = (args, context) => {
    const rest = omit(args, argsToOmit)
    let fullKey = ''
    for (const key of Object.keys(rest)) {
      const value = (rest as any)[key]
      fullKey += `${key}:${JSON.stringify(value)};`
    }
    return fullKey
  }
  return keyArgs
}

export function mergeArraysByField<T extends Record<string, any>>(
  field: keyof T extends string ? keyof T : never
) {
  const merge: FieldMergeFunction<T[], T[]> = (existing, incoming, cache) => {
    const allData = [...(existing || []), ...(incoming || [])]
    const dataByField = allData.reduce(
      (acc, x) => {
        // x will either be a reference or a data object
        const fieldValue = cache.isReference(x)
          ? cache.readField<string>(field, x)
          : x[field]
        if (fieldValue) {
          acc[fieldValue] = x
        }
        return acc
      },
      {} as Record<string, T>
    )
    return Object.values(dataByField)
  }

  return merge
}
