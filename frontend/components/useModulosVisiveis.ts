import { useAppSession } from './AppSessionProvider'

export function useModulosVisiveis() {
  return useAppSession().modulosOcultos
}
