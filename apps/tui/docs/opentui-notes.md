# OpenTUI notes (0.5.11)

What wave 0 actually used, with pointers into the installed type definitions.
Paths are relative to `apps/tui/node_modules/`. This is a cheat sheet, not a
reference: `docs/opentui-api-reference.md` is the full extracted surface, and
the `.d.ts` files are the contract.

## Runtime and versions

| Fact | Value |
| --- | --- |
| Packages | `@opentui/core@0.5.11`, `@opentui/react@0.5.11` |
| Runtime | Bun 1.3.14 (`@opentui/core` exports a `bun` condition backed by Bun FFI) |
| React | 19.3.0, through `react-reconciler@0.33` |
| Native lib | `@opentui/core-darwin-arm64` (an optionalDependency per platform, no build step) |
| Install note | `@opentui/core` declares `engines.node: >=26.4.0`; see the comment in the repo `.npmrc` |

## Boot

```tsx
const renderer = await createCliRenderer({ exitOnCtrlC: false });
createRoot(renderer).render(<App />);
```

- `createCliRenderer` — `@opentui/core/renderer.d.ts:196`. Config:
  `@opentui/core/renderer.d.ts:24` (`exitOnCtrlC`, `targetFps`, `screenMode`,
  `useMouse`, `stdin`/`stdout`, `width`/`height`, `useKittyKeyboard`,
  `onDestroy`).
- `exitOnCtrlC: false` forwards Ctrl+C to the app's own handlers. With the
  default `true` the renderer calls `destroy()` on the first Ctrl+C and the
  app never sees the key.
- `createRoot(renderer)` — `@opentui/react/src/reconciler/renderer.d.ts:25`.
  Returns `{ render, unmount }`. There is no `render()` helper export.
- `renderer.destroy()` leaves the alternate screen and restores the cursor.
  Verified: the byte stream ends with `ESC[?1049l ESC[?25h`.

## Intrinsic elements

The full list is `@opentui/react/jsx-namespace.d.ts:40`:
`box`, `text`, `span`, `code`, `diff`, `markdown`, `input`, `textarea`,
`select`, `scrollbox`, `ascii-font`, `tab-select`, `line-number`, `image`,
and the text modifiers `b`, `i`, `u`, `strong`, `em`, `br`, `a`.

Anything else (for example `EmbeddedTerminalRenderable`, the VT panel wave 1
needs) is NOT an intrinsic element. Register it first:

```tsx
import { EmbeddedTerminalRenderable } from '@opentui/core';
import { extend } from '@opentui/react';
extend({ 'embedded-terminal': EmbeddedTerminalRenderable });
```

`extend` — `@opentui/react/src/components/index.d.ts:41`. Module-augment
`OpenTUIComponents` (`@opentui/react/src/types/components.d.ts`) to type it.

### Props

Props are the renderable's options, flat (there is also an equivalent `style`
object). The ones used here:

- Layout, on every element — `@opentui/core/Renderable.d.ts:29`:
  `flexDirection`, `flexGrow`, `flexShrink`, `alignItems`, `justifyContent`,
  `position`, `top`/`right`/`bottom`/`left`, `overflow`, `padding*`,
  `margin*`, `minWidth`/`maxWidth`, plus `width`/`height`/`zIndex`/`visible`
  at `@opentui/core/Renderable.d.ts:64`. Numbers are cells; `'50%'` works.
- `<box>` — `@opentui/core/renderables/Box.d.ts:6`: `border` (bool or a side
  list), `borderStyle`, `borderColor`, `focusedBorderColor`, `title`,
  `titleColor`, `titleAlignment`, `bottomTitle`, `bottomTitleAlignment`,
  `backgroundColor`, `gap`. A title is drawn INTO the top border line, so a
  panel costs no extra row.
- `<text>` — `@opentui/core/renderables/TextBufferRenderable.d.ts:10`: `fg`,
  `bg`, `attributes`, `wrapMode` (`none|char|word`), `truncate`,
  `selectable`. Children must be strings, numbers, or `<span>`/modifier
  elements — never a `<box>`.
- `<span>` — `@opentui/core/renderables/TextNode.d.ts:7`: `fg`, `bg`,
  `attributes`, `link`. Use it to color part of a line.
- `<scrollbox>` — `@opentui/core/renderables/ScrollBox.d.ts:18`:
  `stickyScroll`, `stickyStart: 'bottom'`, `scrollX`/`scrollY`,
  `scrollbarOptions`, plus `rootOptions`/`viewportOptions`/`contentOptions`
  to style the inner boxes. Imperative API on the ref: `scrollTop`
  (`:69`), `scrollBy` (`:80`), `scrollTo` (`:85`). That is the transcript
  container.
- `<input>` — `@opentui/core/renderables/Input.d.ts:6` (a single-line
  `Textarea`): `value`, `placeholder`, `maxLength`, `focused`, `onInput`,
  `onChange`, `onSubmit`.
- `<textarea>` — `@opentui/core/renderables/Textarea.d.ts:14`: `initialValue`,
  `placeholder`, `keyBindings`, `onSubmit`, `onContentChange`,
  `onCursorChange`, `onKeyDown`.
- `<markdown>` / `<code>` / `<diff>` —
  `@opentui/core/renderables/Markdown.d.ts:68`,
  `@opentui/core/renderables/Code.d.ts:23`,
  `@opentui/core/renderables/Diff.d.ts:8`. All three take `content` plus a
  `syntaxStyle`; `code` also takes `filetype`.

**Trap — `onSubmit` on `<input>`/`<textarea>` has an intersection type.** The
React binding declares `(value: string) => void`
(`@opentui/react/src/types/components.d.ts:41`) and the renderable option
declares `(event: SubmitEvent) => void`
(`@opentui/core/renderables/Textarea.d.ts:24`), so the prop type is BOTH and
no single typed parameter satisfies it. Pass a zero-argument handler and read
the value from your own state (see `src/features/session/session-probe.tsx`).

## Hooks

All from `@opentui/react`:

- `useKeyboard(handler, { release? })` —
  `src/hooks/use-keyboard.d.ts:14`. Every mounted component that calls it gets
  every key; there is no capture/bubble. Gate on your own focus state, as
  `src/ui/list.tsx` does with its `focused` prop.
- `useTerminalDimensions()` — `src/hooks/use-terminal-dimensions.d.ts:1`.
  Returns `{ width, height }` and re-renders on SIGWINCH. Deriving every
  region's size from it is the whole resize story: no extra repaint call is
  needed. Verified at 100×30 → 55×20.
- `useRenderer()` — `src/hooks/use-renderer.d.ts:1`. The `CliRenderer`.
- `useOnResize(cb)` — `src/hooks/use-resize.d.ts:1`. Use only for side effects
  that are not layout (for example resizing a PTY).
- `useFocus(cb)` — terminal WINDOW focus, not widget focus.

`KeyEvent` — `@opentui/core/lib/KeyHandler.d.ts:4`: `name`, `ctrl`, `meta`,
`shift`, `option` (Alt), `sequence`, `raw`, `eventType`, `repeated`,
`preventDefault()`.

**Trap — a capital letter arrives two ways.** Raw mode gives `name: 'G'` with
`shift: false`; the kitty protocol gives `name: 'g'` with `shift: true`.
`src/keymap.ts` normalizes an uppercase single letter to lowercase + shift so
one chord matches both, and so `G` does not also match `g`.

**Trap — shift on punctuation is not reliable.** `?` arrives as name `?` with
`shift` set on some terminals and clear on others, so the matcher ignores
shift for single non-alphanumeric keys.

## Focus

`focused` is a prop on `box`, `input`, `textarea`, `select`, `scrollbox`,
`tab-select` and `line-number` (`@opentui/react/src/types/components.d.ts`).
It is a plain boolean the app owns; OpenTUI does not maintain a focus ring for
you. `app.tsx` keeps one `Focus` value and passes `focused` down.

## Testing

```ts
import { createTestRenderer } from '@opentui/core/testing';   // headless core
import { testRender } from '@opentui/react/test-utils';       // headless + React
```

- `createTestRenderer(options)` — `@opentui/core/testing/test-renderer.d.ts:54`.
  `TestRendererSetup` (`:39`) gives `renderer`, `mockInput`, `mockMouse`,
  `renderOnce()`, `flush()`, `waitFor()`, `waitForFrame()`,
  `waitForVisualIdle()`, `captureCharFrame()`, `captureSpans()`, `resize()`.
- `testRender(node, options)` — `@opentui/react/src/test-utils.d.ts:3`. Same
  setup, with the node already mounted.
- `captureCharFrame()` returns the screen as plain text, one line per row,
  padded with spaces. Assert on it; never on ANSI.
- `mockInput` — `@opentui/core/testing/mock-keys.d.ts:34`: `pressKey`,
  `pressKeys`, `typeText`, `pressEnter`, `pressEscape`, `pressTab`,
  `pressBackspace`, `pressArrow`, `pressCtrlC`, `pasteBracketedText`.

**Trap — wrap key presses in React's `act`.** Without it the state update from
a key has not committed when the next frame is captured, so the assertion
reads the previous frame (and React prints an `act(...)` warning). The
sequence that works:

```ts
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
await act(async () => mockInput.pressKey('j'));
await flush();
expect(captureCharFrame().split('\n')[1]).toStartWith('▌');
```

`testRender`'s own initial mount still logs one `act(...)` warning per test.
It is noise from inside the helper, not a failed assertion.

## Driving the real binary headlessly

The test renderer proves component behavior. To prove the real process boots,
paints, answers keys and restores the terminal, run it under a pseudo-terminal
(macOS `script` cannot: it needs a controlling tty on stdin). `python3 -c` with
`pty.openpty()` + `TIOCSWINSZ` works, and SIGWINCH to the process group
exercises resize. `apps/tui/scripts/live-probe.tsx` is the in-process equivalent
for API behavior.
