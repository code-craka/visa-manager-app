# Contributing to Visa Manager App

We welcome contributions to the Visa Manager App! This guide will help you get started.

## Prerequisites

Before contributing, make sure you have:

- Node.js (>=18)
- Yarn v1 (1.22.x) - Install globally: `npm install -g yarn@1.22.x`
- PostgreSQL database (Neon recommended)
- React Native development environment setup (Android Studio/Xcode)

**Verify Yarn Installation:**
```bash
yarn --version  # Should show 1.22.x
```

## Getting Started

1. **Fork the repository** on GitHub
2. **Clone your fork:**
   ```bash
   git clone https://github.com/YOUR_USERNAME/visa-manager-app.git
   cd visa-manager-app
   ```

3. **Install dependencies:**
   ```bash
   # Backend
   cd visa-manager-backend
   yarn install
   
   # Frontend
   cd ../visa_manager_frontend
   yarn install
   ```

4. **Set up environment variables:**
   - Copy `.env.example` to `.env` in the backend directory
   - Add your Neon PostgreSQL connection string

## Development Workflow

### Running the Application

1. **Start the backend server:**
   ```bash
   cd visa-manager-backend
   yarn start
   ```

2. **Start the frontend (new terminal):**
   ```bash
   cd visa_manager_frontend
   yarn start
   # Then run on device/emulator:
   yarn android  # or yarn ios
   ```

### Available Scripts

#### Backend Scripts
```bash
yarn build      # Compile TypeScript
yarn start      # Start the server
yarn dev        # Start with nodemon (if configured)
yarn test       # Run tests
yarn lint       # Run ESLint
```

#### Frontend Scripts
```bash
yarn start      # Start Metro bundler
yarn android    # Build and run Android app
yarn ios        # Build and run iOS app
yarn test       # Run Jest tests
yarn lint       # Run ESLint
```

### Code Quality

We use several tools to maintain code quality:

- **TypeScript**: Strict mode enabled
- **ESLint**: Code linting and formatting
- **Prettier**: Code formatting
- **Jest**: Unit and integration testing

Before submitting a PR, make sure:
```bash
yarn lint       # No linting errors
yarn test       # All tests pass
yarn build      # Successful build (backend)
```

### Package Management

We use **Yarn v1** as our package manager. Please follow these guidelines:

- Use `yarn add [package]` instead of `npm install [package]`
- Use `yarn add --dev [package]` for dev dependencies
- Commit `yarn.lock` files with your changes
- Never commit `package-lock.json` files
- Use `yarn outdated` to check for package updates
- Use `yarn audit` to check for security vulnerabilities

### Git Workflow

1. **Create a feature branch:**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes** and commit with descriptive messages:
   ```bash
   git add .
   git commit -m "feat: add new feature description"
   ```

3. **Keep your branch updated:**
   ```bash
   git fetch origin
   git rebase origin/main
   ```

4. **Push your branch:**
   ```bash
   git push origin feature/your-feature-name
   ```

5. **Create a Pull Request** on GitHub

### Commit Convention

We follow [Conventional Commits](https://www.conventionalcommits.org/) specification:

- `feat:` New features
- `fix:` Bug fixes
- `docs:` Documentation changes
- `style:` Code style changes (formatting, etc.)
- `refactor:` Code refactoring
- `test:` Adding or modifying tests
- `build:` Changes to build system or dependencies (yarn, webpack, etc.)
- `ci:` Changes to CI configuration
- `chore:` Other changes that don't modify src or test files

### Testing

Please ensure your contributions include appropriate tests:

- **Unit tests** for utility functions and services
- **Integration tests** for API endpoints
- **Component tests** for React Native components

Run tests with:
```bash
yarn test
```

### Documentation

When contributing:

- Update relevant documentation files
- Add JSDoc comments for new functions/methods
- Update README.md if adding new features
- Include examples in your documentation

### Issues and Bugs

When reporting issues:

1. Check existing issues first
2. Use the issue template
3. Include:
   - Steps to reproduce
   - Expected behavior
   - Actual behavior
   - Environment details (OS, Node.js version, Yarn version)
   - Screenshots (if applicable)

### Pull Request Guidelines

- Fill out the PR template completely
- Include a clear description of changes
- Reference related issues
- Ensure CI checks pass
- Request review from maintainers
- Keep PRs focused and atomic

### Code Style

- Follow existing code style
- Use TypeScript for all new code
- Follow React Native best practices
- Use meaningful variable and function names
- Add comments for complex logic

### Dependencies

When adding new dependencies:

- Use `yarn add` for runtime dependencies
- Use `yarn add --dev` for development dependencies
- Prefer well-maintained packages with good documentation
- Consider bundle size impact for frontend dependencies
- Update documentation if the dependency requires setup

## Getting Help

- Check the [README.md](README.md) for setup instructions
- Review existing [Issues](https://github.com/code-craka/visa-manager-app/issues)
- Join our community discussions

Thank you for contributing to Visa Manager App! 🎉
