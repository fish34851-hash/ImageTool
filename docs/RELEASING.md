# Release Process

ImageTool follows semantic versioning and records user-facing changes in `CHANGELOG.md`.

## Checklist

1. Create a focused branch from an up-to-date `main` branch.
2. Implement the change and update automated tests.
3. Update the README, roadmap, and changelog when relevant.
4. Run `npm run check` and `npm test` locally.
5. Open a pull request and wait for every CI job to pass.
6. Review the diff for privacy regressions, unsafe HTML, and unrelated changes.
7. Merge the pull request into `main`.
8. Verify the live GitHub Pages site and its static assets.
9. Create an annotated `vX.Y.Z` tag and a GitHub release using the changelog entry.
10. Triage any regressions reported after release.

Do not publish a release merely to create activity. Every version should contain a meaningful user-facing improvement, bug fix, or maintenance change.
