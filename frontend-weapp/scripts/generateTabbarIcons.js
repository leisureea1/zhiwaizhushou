const fs = require('fs')
const path = require('path')
const sharp = require('sharp')

const outputDir = path.resolve(__dirname, '../src/assets/tabbar')
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true })
}

const size = 96
const palette = {
  default: '#9ca3af',
  active: '#3b82f6'
}

const svgTemplates = {
  home: color => `<?xml version="1.0" encoding="UTF-8"?>
<svg width="96" height="96" viewBox="0 0 96 96" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M18 40L48 16L78 40V80C78 82.2091 76.2091 84 74 84H22C19.7909 84 18 82.2091 18 80V40Z" fill="${color}"/>
  <rect x="40" y="54" width="16" height="30" rx="2" fill="white"/>
</svg>`,
  apps: color => `<?xml version="1.0" encoding="UTF-8"?>
<svg width="96" height="96" viewBox="0 0 96 96" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect x="18" y="20" width="24" height="24" rx="6" fill="${color}"/>
  <rect x="54" y="20" width="24" height="24" rx="6" fill="${color}"/>
  <rect x="18" y="56" width="24" height="24" rx="6" fill="${color}"/>
  <rect x="54" y="56" width="24" height="24" rx="6" fill="${color}"/>
</svg>`,
  profile: color => `<?xml version="1.0" encoding="UTF-8"?>
<svg width="96" height="96" viewBox="0 0 96 96" fill="none" xmlns="http://www.w3.org/2000/svg">
  <circle cx="48" cy="30" r="18" fill="${color}"/>
  <path d="M18 78C18 59.2223 33.2223 44 52 44H44C62.7777 44 78 59.2223 78 78V80C78 82.2091 76.2091 84 74 84H22C19.7909 84 18 82.2091 18 80V78Z" fill="${color}"/>
</svg>`
}

const tasks = []

for (const [name, template] of Object.entries(svgTemplates)) {
  for (const [state, color] of Object.entries(palette)) {
    const svg = template(color)
    const filename = `${name}${state === 'active' ? '-active' : ''}.png`
    const filepath = path.join(outputDir, filename)
    tasks.push(
      sharp(Buffer.from(svg))
        .resize(size, size)
        .png()
        .toFile(filepath)
        .then(() => console.log(`Generated ${filename}`))
    )
  }
}

Promise.all(tasks)
  .then(() => console.log('All tab bar icons generated.'))
  .catch(err => {
    console.error('Failed to generate icons:', err)
    process.exit(1)
  })
