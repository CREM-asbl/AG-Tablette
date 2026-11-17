# Spec: PWA Store Skills

## Objective
Create two reusable user-level skills:

1. `bubblewrap-twa` for generating and maintaining a versioned Android Trusted Web Activity project.
2. `windows-pwa-packaging` for creating and maintaining a versioned Windows Store packaging project.
3. `pwa-store-publishing` for creating or updating CI/CD workflows when missing.

Also add non-active GitHub Actions workflow examples in this repository so future projects can copy them.

## Assumptions
1. Skills live in the user skills directory and are reusable across repositories.
2. Workflow examples in this repo are templates, not active release pipelines.
3. Publishing must happen from CI, while skills prepare or maintain versioned wrapper source projects.

## Tech Stack
- User skills: Markdown `SKILL.md`
- Android wrapper strategy: Bubblewrap / TWA
- Windows wrapper strategy: MSIX packaging project + MSStore CLI
- CI examples: GitHub Actions YAML templates

## Commands
- Repo tests: `pnpm test`
- Repo build: `pnpm run build`
- Bubblewrap init: `bubblewrap init --manifest=https://example.com/manifest.json --directory=android/twa`
- Bubblewrap update: `bubblewrap update --manifest=android/twa/twa-manifest.json`
- Bubblewrap build: `bubblewrap build --manifest=android/twa/twa-manifest.json`
- Bubblewrap publish: `bubblewrap play publish --manifest=android/twa/twa-manifest.json --serviceAccountFile=/path/to/service-account.json --track=internal --appBundleLocation=android/twa/app-release-bundle.aab`
- Windows package build: `msbuild packaging\\MyApp.Store.wapproj /p:Configuration=Release /p:UapAppxPackageBuildMode=StoreUpload /p:AppxBundle=Always`
- MSStore publish: `msstore submission publish <product-id>`

## Project Structure
- `docs/` → specification and usage notes
- `.github/workflows/*.example` → copyable CI templates, not active workflows
- User skills:
  - `C:\Users\gunbl\.agents\skills\bubblewrap-twa\SKILL.md`
  - `C:\Users\gunbl\.agents\skills\windows-pwa-packaging\SKILL.md`
  - `C:\Users\gunbl\.agents\skills\pwa-store-publishing\SKILL.md`

## Code Style
Use concise operational instructions with concrete commands, required secrets, and explicit boundaries.

```md
1. Generate the versioned wrapper source.
2. Commit the wrapper project.
3. Publish only from CI using the provided template.
```

## Testing Strategy
- No code behavior change in the app itself.
- Verify by reading the created skill files and workflow templates.
- Run existing repo tests/build to ensure no regression from added documentation/templates.

## Boundaries
- Always: keep workflows as examples only, use explicit secret names, prefer versioned wrapper source over binary zips.
- Ask first: changing the active project CI, adding dependencies to the app runtime, storing secrets in repo files.
- Never: commit secrets, rely on pwabuilder.com binary zips as the only reproducible source, publish directly from a skill.

## Success Criteria
- `bubblewrap-twa` skill exists in the user skills directory.
- `windows-pwa-packaging` skill exists in the user skills directory.
- `pwa-store-publishing` skill exists in the user skills directory.
- This repo contains copyable Android and Windows store workflow templates.
- The templates document required secrets and manual prerequisites.

## Open Questions
- None for this implementation scope.
