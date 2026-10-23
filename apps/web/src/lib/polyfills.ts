// Next does not polyfill ES2023 array methods; Chrome <110 / Safari <16 lack toSorted.
// shortcut: only toSorted is covered, add others here if client code starts using them.
if (typeof Array.prototype.toSorted !== "function") {
  Object.defineProperty(Array.prototype, "toSorted", {
    configurable: true,
    writable: true,
    value: function toSorted<T>(this: T[], compareFn?: (a: T, b: T) => number) {
      return [...this].sort(compareFn)
    },
  })
}

export {}
