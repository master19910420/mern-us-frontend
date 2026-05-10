/** Detect OS for analytics / admin: windows | mac | linux */
export function detectClientOs() {
  if (typeof navigator === 'undefined') return 'linux'

  // Use multiple browser signals because userAgent can be reduced/spoofed.
  const uaDataPlatform = navigator.userAgentData?.platform || ''
  const platform = navigator.platform || ''
  const ua = navigator.userAgent || ''
  const appVersion = navigator.appVersion || ''
  const oscpu = navigator.oscpu || ''
  const source = `${uaDataPlatform} ${platform} ${ua} ${appVersion} ${oscpu}`.toLowerCase()

  // iPadOS in desktop mode can identify as MacIntel.
  if (
    String(platform).toLowerCase() === 'macintel' &&
    Number(navigator.maxTouchPoints || 0) > 1
  ) {
    return 'mac'
  }

  const scores = { windows: 0, mac: 0, linux: 0 }

  if (/windows|win32|win64|winnt|wow64|wince|win/i.test(source)) scores.windows += 3
  if (/macintosh|mac os|macintel|darwin|iphone|ipad|ipod/i.test(source)) scores.mac += 3
  if (/linux|android|x11|cros|ubuntu|debian|fedora|red hat|suse/i.test(source)) scores.linux += 3

  // Extra hints from dedicated platform fields.
  if (/^win/i.test(String(uaDataPlatform))) scores.windows += 2
  if (/^mac/i.test(String(uaDataPlatform))) scores.mac += 2
  if (/linux|android|chrome os/i.test(String(uaDataPlatform))) scores.linux += 2
  if (/^win/i.test(String(platform))) scores.windows += 2
  if (/^mac/i.test(String(platform))) scores.mac += 2
  if (/linux|x11/i.test(String(platform))) scores.linux += 2

  if (scores.windows >= scores.mac && scores.windows >= scores.linux && scores.windows > 0) {
    return 'windows'
  }
  if (scores.mac >= scores.windows && scores.mac >= scores.linux && scores.mac > 0) return 'mac'
  if (scores.linux > 0) return 'linux'

  // Keep existing behavior for unknown environments.
  return 'linux'
}
