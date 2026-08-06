// Type augmentation so TypeScript recognises @testing-library/jest-dom
// matchers (toHaveClass, toHaveAttribute, toBeInTheDocument, …) on the
// global `expect` in vitest tests. Runtime registration happens in
// src/test/setup.ts (import '@testing-library/jest-dom/vitest').
import '@testing-library/jest-dom';
