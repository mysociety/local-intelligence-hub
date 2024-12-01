import { conf } from '@/components/data/puck/config'

export function getPuckConfigForHostname(hostname: string) {
  // A place for config-level overrides for different host orgs
  return conf
}
