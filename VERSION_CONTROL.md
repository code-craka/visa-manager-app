# Version Control Strategy

This document outlines the version control strategy for the Visa Manager App monorepo.

## Current Release Information

### Version 0.3.1 - Latest Release ✅

- **Release Date:** August 8, 2025
- **Type:** Minor Release
- **Git Tag:** `v0.3.1`
- **Status:** Production Ready
- **Changes:** Complete ClientService implementation, comprehensive testing, input validation

### Version 0.3.0 - Previous Release

- **Release Date:** August 6, 2025
- **Type:** Major Release
- **Git Tag:** `v0.3.0`
- **Status:** Stable
- **Changes:** JWT template integration, major codebase cleanup, zero TypeScript errors

### Version 0.2.1 - Previous Release

- **Release Date:** August 5, 2025
- **Type:** Patch Release
- **Git Tag:** `v0.2.1`
- **Status:** Stable
- **Changes:** TypeScript compilation fixes, build optimizations

### Version 0.2.0 - Previous Release

- **Release Date:** August 4, 2025
- **Type:** Minor Release
- **Git Tag:** `v0.2.0`
- **Status:** Stable
- **Changes:** Real-time features, Material Design, API enhancements

## Branching Strategy

We will employ a simplified Gitflow-like branching strategy to manage development, releases, and hotfixes.

- **`main` branch:** This branch always reflects the production-ready state. Only stable, tested code is merged into `main`.
- **`develop` branch:** This is the primary development branch. All new features and bug fixes are integrated here.
- **`feature/<feature-name>` branches:** Created from `develop` for new features. Once a feature is complete and reviewed, it is merged back into `develop`.
- **`bugfix/<bug-name>` branches:** Created from `develop` for bug fixes. Once a bug is fixed and reviewed, it is merged back into `develop`.
- **`release/<version>` branches:** Created from `develop` when preparing a new release. Only critical bug fixes are allowed here. Once stable, it is merged into `main` and `develop`, and tagged.
- **`hotfix/<hotfix-name>` branches:** Created directly from `main` to quickly address critical production issues. Once fixed, it is merged into `main` and `develop`, and tagged.

## Commit Message Guidelines

Commit messages should be clear, concise, and descriptive. We follow the Conventional Commits specification to provide a standardized commit history.

Each commit message consists of a **header**, a **body**, and a **footer**.

```
<type>(<scope>): <short description>

[optional body]

[optional footer(s)]
```

- **`type`:** (Required) Must be one of the following:
  - `feat`: A new feature
  - `fix`: A bug fix
  - `docs`: Documentation only changes
  - `style`: Changes that do not affect the meaning of the code (white-space, formatting, missing semicolons, etc.)
  - `refactor`: A code change that neither fixes a bug nor adds a feature
  - `perf`: A code change that improves performance
  - `test`: Adding missing tests or correcting existing tests
  - `build`: Changes that affect the build system or external dependencies (example scopes: gulp, broccoli, yarn)
  - `ci`: Changes to our CI configuration files and scripts (example scopes: Travis, Circle, BrowserStack, SauceLabs)
  - `chore`: Other changes that don't modify src or test files
  - `revert`: Reverts a previous commit

- **`scope`:** (Optional) Specifies the place of the commit change. For this monorepo, common scopes would be `backend`, `frontend`, `docs`, `infra`, etc.

- **`description`:** (Required) A very short description of the change.

- **`body`:** (Optional) A longer description providing additional context.

- **`footer`:** (Optional) Used for breaking changes or referencing issues (e.g., `BREAKING CHANGE:`, `Closes #123`).

## Pull Request (PR) Process

1. **Create a new branch:** Always work on a new `feature/`, `bugfix/`, `release/`, or `hotfix/` branch.
2. **Commit changes:** Follow the commit message guidelines.
3. **Push branch:** Push your branch to the remote repository.
4. **Create a Pull Request:** Open a PR from your branch to `develop` (or `main` for hotfixes/releases).
5. **Code Review:** Request reviews from at least one other team member.
6. **Address Feedback:** Make necessary changes based on review comments.
7. **Merge:** Once approved, merge the PR. For `feature` and `bugfix` branches, squash and merge is recommended to keep a clean `develop` history.

## Tagging and Releases

- **Version Numbers:** We follow Semantic Versioning (MAJOR.MINOR.PATCH).
- **Tagging:** Releases are marked with Git tags (e.g., `v1.0.0`). Tags are created from the `main` branch after a release merge.
- **Release Process:** When a `release/<version>` branch is ready, it is merged into `main` and `develop`. A tag is then created on `main`.

## Git Tag Management

### Current Tags

- `v0.3.1` - Latest stable release (ClientService implementation)
- `v0.3.0` - JWT template integration and codebase cleanup
- `v0.2.1` - TypeScript fixes
- `v0.2.0` - Real-time features and Material Design
- `v0.1.0` - Initial release (deprecated)

### Creating Tags

```bash
# Create and push a new tag
git tag -a v0.2.1 -m "Release version 0.2.1 - TypeScript compilation fixes"
git push origin v0.2.1

# List all tags
git tag -l

# Delete a tag (if needed)
git tag -d v0.2.1
git push origin --delete v0.2.1
```

### Tag Naming Convention

- **Format:** `v<MAJOR>.<MINOR>.<PATCH>`
- **Examples:** `v1.0.0`, `v1.2.3`, `v2.0.0-beta.1`
- **Pre-releases:** Use suffixes like `-alpha.1`, `-beta.2`, `-rc.1`

### Release Workflow

1. **Prepare Release:** Create `release/v0.2.1` branch from `develop`
2. **Update Documentation:** Update CHANGELOG.md, README.md, package.json versions
3. **Test Release:** Run full test suite and integration tests
4. **Merge to Main:** Create PR from `release/v0.2.1` to `main`
5. **Create Tag:** Tag the merge commit on `main`
6. **Deploy:** Deploy tagged version to production
7. **Merge Back:** Merge `main` back to `develop` to sync changes
