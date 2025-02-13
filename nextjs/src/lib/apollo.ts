import { DocumentNode, FieldMergeFunction } from '@apollo/client'
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
  field: keyof T,
  fragment?: DocumentNode
) {
  const merge: FieldMergeFunction<T[], T[]> = (
    existing,
    incoming,
    { isReference, cache }
  ) => {
    const dataByField: Record<string, T> = {}
    const allData = [
      ...(existing || []),
      ...(incoming || []).map((x) => {
        if (!isReference(x)) {
          return x as T // it's already a data object
        } else if (fragment) {
          // convert the Reference to a data object
          const o = cache.readFragment({
            fragment, // use a fragment with all properties on todo
            id: cache.identify(x),
          }) as T | null
          return o
        }
      }),
    ].filter((x) => !!x)

    for (const d of allData) {
      if (d[field]) {
        dataByField[d[field]] = d
      }
    }

    return Object.values(dataByField)
  }

  return merge
}
