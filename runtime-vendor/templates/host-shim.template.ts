/**
 * host-shim.template.ts
 * Layer 4 (Shim) starters — keep thin; no business logic.
 */

/** React bridge: runtime sets globalThis.React before bundle load. */
export function createReactShimSource(): string {
  return `const React = globalThis.React;
if (!React) throw new Error("react-shim: globalThis.React is not set");
export default React;
`;
}

/** JSX automatic runtime bridge. */
export function createJsxRuntimeShimSource(): string {
  return `const React = globalThis.React;
if (!React) throw new Error("jsx-runtime-shim: globalThis.React is not set");
export const Fragment = React.Fragment;
export function jsx(type, props, key) {
  return React.createElement(type, key != null ? { ...props, key } : props);
}
export const jsxs = jsx;
`;
}

/** Theme injection for browser rehost (replaces IDE host). */
export function injectHostThemeBridge(): void {
  if (typeof window === "undefined") return;
  const host = (window as unknown as { __hostRuntime?: { state: { theme: string } } }).__hostRuntime;
  if (!host?.state) return;
  const mq = window.matchMedia("(prefers-color-scheme: dark)");
  const apply = () => {
    host.state.theme = mq.matches ? "dark" : "light";
  };
  apply();
  mq.addEventListener("change", apply);
}

/**
 * esbuild externals plugin sketch — wire cursor/canvas or HOST_MODULE to asset URL.
 * @param {string} runtimeAssetUrl e.g. "/assets/canvas-runtime.js"
 */
export function createExternalsPlugin(runtimeAssetUrl: string) {
  return {
    name: "host-runtime-externals",
    setup(b: import("esbuild").PluginBuild) {
      b.onResolve({ filter: /^HOST_MODULE$/ }, () => ({
        path: runtimeAssetUrl,
        external: true,
      }));
      b.onResolve({ filter: /^react$/ }, () => ({
        path: "/assets/react-shim.mjs",
        external: true,
      }));
      b.onResolve({ filter: /^react\/jsx-runtime$/ }, () => ({
        path: "/assets/jsx-runtime-shim.mjs",
        external: true,
      }));
    },
  };
}
