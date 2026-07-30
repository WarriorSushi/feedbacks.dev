import assert from 'node:assert/strict'
import test from 'node:test'
import { csvCell } from '../../src/lib/csv-export.ts'

test('CSV cells preserve Unicode, delimiters, quotes, and newlines', () => {
  assert.equal(csvCell('Hi, “world”\nनमस्ते'), '"Hi, “world”\nनमस्ते"')
  assert.equal(csvCell(['one', 'two']), '"one; two"')
  assert.equal(csvCell(null), '')
})

test('CSV cells neutralize spreadsheet formulas after leading whitespace', () => {
  assert.equal(csvCell('=1+1'), "\"'=1+1\"")
  assert.equal(csvCell('  @SUM(A1:A2)'), "\"'  @SUM(A1:A2)\"")
  assert.equal(csvCell('-2'), "\"'-2\"")
})
