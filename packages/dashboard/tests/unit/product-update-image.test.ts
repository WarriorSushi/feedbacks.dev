import assert from 'node:assert/strict'
import test from 'node:test'
import {
  calculateProductUpdateCrop,
  calculateProductUpdateOutput,
} from '../../src/components/product-updates/product-update-image.ts'

test('product update image crop follows aspect ratio and focal point', () => {
  const left = calculateProductUpdateCrop(2000, 1000, '1:1', 0, 50)
  const right = calculateProductUpdateCrop(2000, 1000, '1:1', 100, 50)

  assert.deepEqual(left, { x: 0, y: 0, width: 1000, height: 1000 })
  assert.deepEqual(right, { x: 1000, y: 0, width: 1000, height: 1000 })
})

test('product update image resize never enlarges the crop', () => {
  assert.deepEqual(
    calculateProductUpdateOutput({ width: 800, height: 450 }, 1600),
    { width: 800, height: 450 },
  )
  assert.deepEqual(
    calculateProductUpdateOutput({ width: 1600, height: 900 }, 640),
    { width: 640, height: 360 },
  )
})
