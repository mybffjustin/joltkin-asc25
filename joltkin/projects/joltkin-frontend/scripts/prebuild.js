#!/usr/bin/env node
/* eslint-disable no-console */
import { spawnSync } from 'node:child_process'

const isVercel = process.env.VERCEL === '1'

if (isVercel) {
  console.log('Skipping Algokit client generation on Vercel build environment')
  process.exit(0)
}

console.log('Generating Algokit app clients before build...')
const result = spawnSync('npm', ['run', 'generate:app-clients'], { stdio: 'inherit', shell: process.platform === 'win32' })

if (result.status !== 0) {
  console.error('Failed to generate Algokit app clients before build')
  process.exit(result.status ?? 1)
}
