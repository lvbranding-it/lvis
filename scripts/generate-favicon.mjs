/**
 * generate-favicon.mjs
 * One-time script — generates favicon.ico + apple-icon.png from the official LVIS brand SVG.
 * Usage: node scripts/generate-favicon.mjs
 */

import sharp from 'sharp'
import toIco from 'to-ico'
import { readFileSync, writeFileSync, copyFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '..')

const SVG_SOURCE = '/Volumes/LV Branding SERVER/LV_ Branding/LVIS/SVG/LVIS-icon.svg'
const svgBuf = readFileSync(SVG_SOURCE)

// 1. Copy SVG as src/app/icon.svg (Next.js serves as /icon.svg — preferred by modern browsers)
copyFileSync(SVG_SOURCE, resolve(ROOT, 'src/app/icon.svg'))
console.log('✅ src/app/icon.svg copied')

// 2. Apple icon 180×180
const apple = await sharp(svgBuf).resize(180, 180).png().toBuffer()
writeFileSync(resolve(ROOT, 'src/app/apple-icon.png'), apple)
console.log('✅ src/app/apple-icon.png (180×180) written')

// 3. favicon.ico — 16, 32, 48 px layers
const sizes = [16, 32, 48]
const pngs = await Promise.all(sizes.map(s => sharp(svgBuf).resize(s, s).png().toBuffer()))
const ico = await toIco(pngs)
writeFileSync(resolve(ROOT, 'src/app/favicon.ico'), ico)
console.log('✅ src/app/favicon.ico (16/32/48) written')

console.log('\nDone! Commit the three generated files:')
console.log('  src/app/favicon.ico')
console.log('  src/app/icon.svg')
console.log('  src/app/apple-icon.png')
