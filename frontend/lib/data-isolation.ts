export function isUserOwnedStoragePath(path: string, userId: string): boolean {
  const [owner, ...parts] = path.split('/')
  return owner === userId && parts.length > 0 && parts.every(Boolean)
}
