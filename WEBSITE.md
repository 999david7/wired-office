# Wired Office website

Static download page for Wired Paper, Wired Grid and Wired Slides. No build step.

At load, `app.js` asks the GitHub API for each repo's latest release under the
`Wired-Office` org and points the download button at its `.dmg` (falling back to
`.zip`/`.pkg`, then the release page). Results are cached in `localStorage` for
15 minutes to stay under GitHub's 60-requests-per-hour anonymous limit. Repos
without a release show "Coming soon"; if the API is unreachable the button links
to `github.com/Wired-Office/<repo>/releases/latest`.

To add or edit an app, change the `APPS` list in `app.js` and drop its icon in
`assets/<id>.png`.

## Run locally

```bash
python3 -m http.server 4173
```

## Deploy

Any static host works. For GitHub Pages, push this folder to a repo and enable
Pages on the default branch.
