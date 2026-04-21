# Contributing to leanlearn

First off, thank you for considering contributing to **leanlearn**! It's people like you that make leanlearn such a great tool for the community.

## 🌈 Code of Conduct

By participating in this project, you agree to abide by our Code of Conduct (standard contributor covenant). Please be respectful and professional in all interactions.

## 🚀 How Can I Contribute?

### Reporting Bugs
- Check the [GitHub Issues](https://github.com/adityak74/leanlearn/issues) to see if the bug has already been reported.
- If not, open a new issue. Include a clear title, a description of the problem, and steps to reproduce.
- Provide environment details (Node version, Browser, OS).

### Suggesting Enhancements
- Open a new issue with the tag `enhancement`.
- Describe the feature and why it would be useful for the "Lean" experience.

### Pull Requests
1. Fork the repo and create your branch from `main`.
2. If you've added code that should be tested, add tests.
3. If you've changed APIs, update the documentation.
4. Ensure the test suite passes (`npm test`).
5. Make sure your code lints and is properly typed.
6. Issue that pull request!

## 💻 Local Development Workflow

1. **Setup:** Follow the [Setup Guide](SETUP.md).
2. **Branching:** Use descriptive branch names:
   - `feat/feature-name`
   - `fix/bug-name`
   - `docs/topic-name`
3. **Commits:** Follow conventional commit messages:
   - `feat: add new profile card`
   - `fix: resolved race condition in progress loader`
   - `docs: update setup instructions`

## 🎨 Coding Standards

### TypeScript
- We use strict TypeScript. Avoid using `any` unless absolutely necessary.
- Export interfaces and types that are reused across routes.

### Database
- All schema changes must be done in `app/db/schema.ts`.
- Run `npm run db:generate` to create migrations.
- Test changes locally using `dev.db` via `drizzle.dev.config.ts`.

### Performance
- Always parallelize data fetching in loaders using `Promise.all`.
- Keep the bundle size "Lean". Avoid heavy third-party libraries.
- Prefer Vanilla CSS over CSS-in-JS.

## 📬 Questions?

Feel free to open an issue or reach out to the maintainers if you have any questions about the contribution process.

---

Happy coding! 🎓
