# Montara CI

[![GitHub Super-Linter](https://github.com/actions/typescript-action/actions/workflows/linter.yml/badge.svg)](https://github.com/super-linter/super-linter)
![CI](https://github.com/actions/typescript-action/actions/workflows/ci.yml/badge.svg)
[![Check dist/](https://github.com/actions/typescript-action/actions/workflows/check-dist.yml/badge.svg)](https://github.com/actions/typescript-action/actions/workflows/check-dist.yml)
[![CodeQL](https://github.com/actions/typescript-action/actions/workflows/codeql-analysis.yml/badge.svg)](https://github.com/actions/typescript-action/actions/workflows/codeql-analysis.yml)

## 🤔 What is Montara CI?

Montara CI is a GitHub Action that allows you to execute a pipeline test run in
Montara before merging a pull request. If the pipeline fails, the pull request
can not be merged.

## Getting started

- Create a [Montara accout](https://app.montara.io)

- Connect Montara to your data warehouse (see
  [Docs](https://app.montara.io/docs/docs/Settings/#warehouse-connection)).

- Connect Montara to your git repo in the
  [Montara settings page](https://app.montara.io/app/settings?selectedSettingsTab=2)
  (see
  [Docs](https://app.montara.io/docs/docs/Settings/Integrations/dbt/GitHubRepo/)).

- Montara CI triggers a test run via a webhook. Copy the webhook URL from the
  [pipeline settings page](https://app.montara.io/app/pipelines) in Montara.
  ![Webhook url](./images/MCI%20webhook.gif)

- Create a `ci.yml` file in your `.github/workflows` directory with the
  following content:

```yaml
name: Montara CI
on:
  pull_request:
    branches:
      - 'main'
      - 'montara_main'
permissions:
  contents: read

jobs:
  montara:
    runs-on: ubuntu-latest
    steps:
      - name: Montara CI
        env:
          MONTARA_GITHUB_TOKEN: ${{ secrets.MONTARA_GITHUB_TOKEN }}
        uses: montara-io/montara-ci@v0.0.10
        with:
          webhookUrl: <replace-with-copied-webhook-url>
```

- You're good to go 🚀. Go ahead and create a new PR.

## Contributing to Montara CI

1. Clone the repo `git clone github.com/montara-io/montara-ci`

1. :hammer_and_wrench: Install the dependencies

   ```bash
   npm install
   ```

1. :building_construction: Package the TypeScript for distribution

   ```bash
   npm run bundle
   ```

1. :white_check_mark: Run the tests

   ```bash
   $ npm test

   PASS  ./index.test.js
     ✓ throws invalid number (3ms)
     ✓ wait 500 ms (504ms)
     ✓ test runs (95ms)

   ...
   ```

1. Make your changes
1. Format, test, and build the action

   ```bash
   npm run all
   ```

## Publishing a New Release

This project includes a helper script, [`script/release`](./script/release)
designed to streamline the process of tagging and pushing new releases for
GitHub Actions.

GitHub Actions allows users to select a specific version of the action to use,
based on release tags. This script simplifies this process by performing the
following steps:

1. **Retrieving the latest release tag:** The script starts by fetching the most
   recent release tag by looking at the local data available in your repository.
1. **Prompting for a new release tag:** The user is then prompted to enter a new
   release tag. To assist with this, the script displays the latest release tag
   and provides a regular expression to validate the format of the new tag.
1. **Tagging the new release:** Once a valid new tag is entered, the script tags
   the new release.
1. **Pushing the new tag to the remote:** Finally, the script pushes the new tag
   to the remote repository. From here, you will need to create a new release in
   GitHub and users can easily reference the new tag in their workflows.
