import assert from 'node:assert/strict'
import test from 'node:test'
import {
  calculateProductUpdateCrop,
  calculateProductUpdateOutput,
  moveProductUpdateCrop,
  resizeProductUpdateCropFromCorner,
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

test('matching image and crop ratios have no movable crop area', () => {
  assert.deepEqual(
    calculateProductUpdateCrop(588, 441, '4:3', 0, 0),
    { x: 0, y: 0, width: 588, height: 441 },
  )
  assert.deepEqual(
    calculateProductUpdateCrop(588, 441, '4:3', 100, 100),
    { x: 0, y: 0, width: 588, height: 441 },
  )
})

test('crop rectangle movement stays within the image', () => {
  const crop = { x: 200, y: 100, width: 800, height: 450 }

  assert.deepEqual(moveProductUpdateCrop(crop, -500, 900, 1600, 900), {
    x: 0,
    y: 450,
    width: 800,
    height: 450,
  })
})

test('corner resizing preserves the crop ratio and image bounds', () => {
  const crop = { x: 400, y: 225, width: 800, height: 450 }
  const resized = resizeProductUpdateCropFromCorner(
    crop,
    'se',
    2000,
    1200,
    1600,
    900,
    100,
  )

  assert.equal(resized.x, 400)
  assert.equal(resized.y, 225)
  assert.equal(resized.x + resized.width, 1600)
  assert.equal(resized.y + resized.height, 900)
  assert.equal(resized.width / resized.height, 16 / 9)
})
