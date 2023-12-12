## React + TypeScript + Vite@5 template

> This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

- [Changing into the  template with React + TypeScript + Vite@5](https://github.com/keon981/vite-tsx-app/tree/vite%404)

## Overview

> Built with type safety, scalability, and developer experience in mind. A batteries included Vite + React template.

* pnpm - A strict and efficient alternative to npm with up to 3x faster performance
* TypeScript - A typed superset of JavaScript designed with large scale applications in mind
* ESLint(Airbnb) - Static code analysis to help find problems within a codebase
* Vite@5- Feature rich and highly optimized frontend tooling with TypeScript support out of the box
  - [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh
* Vitest@1.0.0-beta.5 - A blazing fast unit test framework powered by Vite
  * React Testing Library - A very light-weight, best practice first, solution for testing React components
  * MSW（Mock Service Worker） - Mocking API tools

## Requirements

* NodeJS 18+
* pnpm 7+

## Getting Started

1. Getting started is a simple as cloning the repository
   ```
   git clone git@github.com:keon981/vite-tsx-app.git

   ```
2. Changing into the new directory
   ```
   cd vite-tsx-app
   ```
3. Installing dependencies
   ```
   pnpm install
   ```
4. Removing the .git folder (and any additional files, folders or dependencies you may not need)
   ```
   rm -rf .git
   ```

Congrats! You're ready to starting working on that new project!

> If you'd rather run the commands above in one go, check out the command below：
>
> ```
> git clone git@github.com:keon981/vite-tsx-app.git &&\
> cd vite-tsx-app &&\
> pnpm install &&\
> rm -rf .git
> ```

## Testing

Unit testing is handled by React Testing Library and Vitest while End-to-End (E2E) Testing is conducted by Playwright.

If you'd like to run all tests, Unit and E2E alike, execute the following command:

```
pnpm run test
```

### Unit Testing

When running unit test scripts, it is assumed that unit tests will be colocated with the source files. Take a look at the placeholder README file in `src/components` for [an example](src/components/README.md).

If you'd like to execute unit tests specifically, the below command will execute vitest:

```
pnpm run test:unit
```

If instead you are interested in coverage reporting, run:

```
pnpm run coverage
```
