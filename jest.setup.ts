import '@testing-library/jest-dom'

const { TextDecoder, TextEncoder } = require('util')
const {
  ReadableStream,
  ReadableStreamBYOBReader,
  ReadableStreamDefaultReader,
  TextDecoderStream,
  TextEncoderStream,
  TransformStream,
  WritableStream,
  WritableStreamDefaultWriter,
} = require('stream/web')

if (typeof globalThis.TextDecoder === 'undefined') {
  globalThis.TextDecoder = TextDecoder
}

if (typeof globalThis.TextEncoder === 'undefined') {
  globalThis.TextEncoder = TextEncoder
}

if (typeof globalThis.TextDecoderStream === 'undefined') {
  globalThis.TextDecoderStream = TextDecoderStream
}

if (typeof globalThis.TextEncoderStream === 'undefined') {
  globalThis.TextEncoderStream = TextEncoderStream
}

if (typeof globalThis.ReadableStream === 'undefined') {
  globalThis.ReadableStream = ReadableStream
}

if (typeof globalThis.ReadableStreamBYOBReader === 'undefined') {
  globalThis.ReadableStreamBYOBReader = ReadableStreamBYOBReader
}

if (typeof globalThis.ReadableStreamDefaultReader === 'undefined') {
  globalThis.ReadableStreamDefaultReader = ReadableStreamDefaultReader
}

if (typeof globalThis.TransformStream === 'undefined') {
  globalThis.TransformStream = TransformStream
}

if (typeof globalThis.WritableStream === 'undefined') {
  globalThis.WritableStream = WritableStream
}

if (typeof globalThis.WritableStreamDefaultWriter === 'undefined') {
  globalThis.WritableStreamDefaultWriter = WritableStreamDefaultWriter
}

if (typeof globalThis.structuredClone === 'undefined') {
  globalThis.structuredClone = (value) => JSON.parse(JSON.stringify(value))
}

const edgePrimitives = require('next/dist/compiled/@edge-runtime/primitives')

if (typeof globalThis.Request === 'undefined') {
  globalThis.Request = edgePrimitives.Request
}

if (typeof globalThis.Response === 'undefined') {
  globalThis.Response = edgePrimitives.Response
}

if (typeof globalThis.Headers === 'undefined') {
  globalThis.Headers = edgePrimitives.Headers
}
