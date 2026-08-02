import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises'
import { dirname, extname, isAbsolute, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { icons as fluentIcons } from '@iconify-json/fluent'
import { icons as icIcons } from '@iconify-json/ic'
import { icons as mdiIcons } from '@iconify-json/mdi'
import { getIconData } from '@iconify/utils'

const scriptDirectory = dirname(fileURLToPath(import.meta.url))
const webDirectory = resolve(scriptDirectory, '..')
const webSourceDirectory = resolve(webDirectory, 'src')
const contractsSourceDirectory = resolve(webDirectory, '../../packages/contracts/src')
const generatedDirectory = resolve(webSourceDirectory, 'icons/generated')
const sourceExtensions = new Set(['.ts', '.vue'])
const iconNamePattern = /\b(fluent|mdi|ic):([a-z0-9]+(?:-[a-z0-9]+)*)\b/g
const iconSets = {
  fluent: fluentIcons,
  ic: icIcons,
  mdi: mdiIcons,
}
const editorOnlyDirectories = [
  resolve(webSourceDirectory, 'editor'),
  resolve(webSourceDirectory, 'materials'),
  resolve(webSourceDirectory, 'pages/screen'),
]

async function collectSourceFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true })
  const files = await Promise.all(
    entries.map(async (entry) => {
      const path = resolve(directory, entry.name)
      if (entry.isDirectory()) return collectSourceFiles(path)
      return sourceExtensions.has(extname(entry.name)) ? [path] : []
    }),
  )
  return files.flat()
}

function isInside(directory, file) {
  const path = relative(directory, file)
  return path === '' || (!path.startsWith('..') && !isAbsolute(path))
}

async function collectIconNames(files) {
  const names = new Map(Object.keys(iconSets).map((prefix) => [prefix, new Set()]))

  await Promise.all(
    files.map(async (file) => {
      const source = await readFile(file, 'utf8')
      for (const match of source.matchAll(iconNamePattern)) {
        names.get(match[1])?.add(match[2])
      }
    }),
  )

  return names
}

function subtractIconNames(allNames, excludedNames) {
  return new Map(
    [...allNames].map(([prefix, names]) => [
      prefix,
      new Set([...names].filter((name) => !excludedNames.get(prefix)?.has(name))),
    ]),
  )
}

function createCollections(namesByPrefix) {
  return [...namesByPrefix]
    .filter(([, names]) => names.size > 0)
    .map(([prefix, names]) => {
      const iconSet = iconSets[prefix]
      const icons = Object.fromEntries(
        [...names].sort().map((name) => {
          const icon = getIconData(iconSet, name)
          if (!icon) throw new Error(`Icon \"${prefix}:${name}\" does not exist`)
          return [name, icon]
        }),
      )
      return { prefix, icons }
    })
}

function serializeCollections(collections) {
  return `${JSON.stringify(collections, null, 2)}\n`
}

async function updateGeneratedFile(name, collections, checkOnly) {
  const path = resolve(generatedDirectory, `${name}.json`)
  const content = serializeCollections(collections)

  if (checkOnly) {
    const currentContent = await readFile(path, 'utf8').catch(() => '')
    if (currentContent !== content) {
      throw new Error(
        `Generated icon subset is stale: ${relative(webDirectory, path)}. Run pnpm icons:generate.`,
      )
    }
    return
  }

  await mkdir(generatedDirectory, { recursive: true })
  await writeFile(path, content)
}

const webFiles = await collectSourceFiles(webSourceDirectory)
const contractFiles = await collectSourceFiles(contractsSourceDirectory)
const coreFiles = [
  ...webFiles.filter(
    (file) => !editorOnlyDirectories.some((directory) => isInside(directory, file)),
  ),
  ...contractFiles,
]
const coreIconNames = await collectIconNames(coreFiles)
const allIconNames = await collectIconNames([...webFiles, ...contractFiles])
const editorIconNames = subtractIconNames(allIconNames, coreIconNames)
const checkOnly = process.argv.includes('--check')

await Promise.all([
  updateGeneratedFile('core', createCollections(coreIconNames), checkOnly),
  updateGeneratedFile('editor', createCollections(editorIconNames), checkOnly),
])
