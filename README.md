# Scoreboard PWA

## What this program is for
Scoreboard is a simple, offline-first app for tracking people and points. It lets you add players, update scores, sort/search, and keep multiple boards. It also supports installing the app on supported browsers.

## What we use in this program
- React + Vite for the UI and build
- Tailwind CSS for styling
- Service Worker + Web Manifest for PWA/offline support
- React Testing Library + Vitest for tests

## What you need to know
- The "Install" button appears when the browser supports PWA install. On browsers without install support, the app shows manual instructions or runs in the browser.
- The service worker only registers in production builds, so install/offline behavior is best tested via `npm run build` + `npm run preview`.

## Scripts
- `npm run dev` - start the dev server
- `npm run build` - build for production
- `npm run preview` - preview the production build
- `npm run lint` - run ESLint
- `npm test` - run tests
