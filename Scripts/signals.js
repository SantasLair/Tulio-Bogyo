// Deprecated: Tulio now provides first-class signals at runtime.
// Use one-liners from any script:
//   emitSignal('dotConsumed', payload)
//   onSignal('dotConsumed', (payload) => { ... })
// Or from a Behaviour:
//   this.emitSignal('dotConsumed', payload)
//   this.onSignal('dotConsumed', handler)
//
// This file remains only for backward compatibility with older demos.

export const signals = null;
