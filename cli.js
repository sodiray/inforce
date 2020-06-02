#!/usr/bin/env node
import parse from 'minimist'

import { run } from './index.js'

const args = parse(process.argv.slice(2));

(async () => {
    try {
      await run(args)
    } catch (err) {
      console.error(err)
      process.exit(1)
    }
    process.exit(0)
  })()
  