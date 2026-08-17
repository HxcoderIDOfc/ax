const SDK_URL = 'https://sdk.axynera.my.id/v/0.4.2/axynera.mjs'
const mod = await import(/* @vite-ignore */ SDK_URL)

const Axynera = mod.default
const AxyneraAuth = mod.AxyneraAuth

if (!Axynera || !AxyneraAuth) {
  throw new Error('Axynera SDK v0.4.2 tidak lengkap.')
}

export { AxyneraAuth }
export default Axynera
