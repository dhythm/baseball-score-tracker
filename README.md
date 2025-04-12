# Baseball Score Tracker

## Adding Turborepo to the repository

https://turbo.build/docs/getting-started/add-to-existing-repository#adding-turborepo-to-your-repository

```sh
touch package.json turbo.json .gitignore
touch pnpm-workspace.yaml

pnpm add turbo --save-dev --workspace-root

mkdir apps packages
```