import { expect, test } from 'vitest'
import { validateImage, buildKey, MAX_IMAGE_BYTES } from './r2'

test('validateImage accepts an image under 12MB', () => {
  expect(validateImage(new File([new Uint8Array([1, 2, 3])], 'a.jpg', { type: 'image/jpeg' }))).toBeNull()
})

test('validateImage rejects non-image', () => {
  expect(validateImage(new File([new Uint8Array([1])], 'a.txt', { type: 'text/plain' }))).toMatch(/image/i)
})

test('validateImage rejects SVG', () => {
  expect(validateImage(new File([new Uint8Array([1])], 'x.svg', { type: 'image/svg+xml' }))).toMatch(/svg/i)
})

test('validateImage rejects >12MB', () => {
  const big = new File([new Uint8Array(1)], 'a.jpg', { type: 'image/jpeg' })
  Object.defineProperty(big, 'size', { value: MAX_IMAGE_BYTES + 1 })
  expect(validateImage(big)).toMatch(/12\s*MB/i)
})

test('buildKey sanitizes the filename and prefixes', () => {
  const key = buildKey('photos/onekey', 'my file (1).JPG')
  expect(key).toMatch(/^photos\/onekey\/\d+_my_file__1_\.JPG$/)
})
