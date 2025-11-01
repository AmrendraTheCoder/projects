# Contributing to Adaptive Yield Router

Thank you for considering contributing to Adaptive Yield Router! We welcome contributions from the community.

## How to Contribute

### Reporting Bugs

If you find a bug, please open an issue with:
- Clear description of the bug
- Steps to reproduce
- Expected vs actual behavior
- Environment details (OS, Node version, etc.)

### Suggesting Features

Feature suggestions are welcome! Please:
- Check if the feature is already proposed
- Clearly describe the feature and use case
- Explain why it would be valuable

### Code Contributions

1. **Fork the Repository**
   ```bash
   git clone https://github.com/your-username/adaptive-yield-router
   cd adaptive-yield-router
   ```

2. **Create a Branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

3. **Make Your Changes**
   - Write clean, documented code
   - Follow existing code style
   - Add tests for new features
   - Update documentation

4. **Test Your Changes**
   ```bash
   npm test
   npm run lint
   ```

5. **Commit Your Changes**
   ```bash
   git add .
   git commit -m "feat: add amazing feature"
   ```

   Follow [Conventional Commits](https://www.conventionalcommits.org/):
   - `feat:` - New features
   - `fix:` - Bug fixes
   - `docs:` - Documentation changes
   - `test:` - Test additions/changes
   - `refactor:` - Code refactoring
   - `chore:` - Maintenance tasks

6. **Push and Create PR**
   ```bash
   git push origin feature/your-feature-name
   ```
   Then open a Pull Request on GitHub

## Development Guidelines

### Solidity Code Style

- Use Solidity 0.8.20
- Follow [Solidity Style Guide](https://docs.soliditylang.org/en/latest/style-guide.html)
- Add NatSpec comments for all public functions
- Keep functions small and focused
- Use descriptive variable names

### JavaScript/React Code Style

- Use ES6+ features
- Functional components with hooks
- Meaningful component and variable names
- Comment complex logic
- Keep components small and reusable

### Testing Requirements

- Write unit tests for all new functions
- Maintain >80% code coverage
- Include integration tests for new features
- Test edge cases and error conditions

### Documentation

- Update README.md for user-facing changes
- Update ARCHITECTURE.md for system changes
- Add inline comments for complex logic
- Keep documentation clear and concise

## Code Review Process

1. Automated checks must pass (tests, linting)
2. At least one maintainer review required
3. All feedback must be addressed
4. No merge conflicts
5. Squash commits before merge

## Security

- Never commit private keys or sensitive data
- Report security issues privately to team
- Follow security best practices
- Get security review for critical changes

## Community

- Be respectful and inclusive
- Help others in discussions
- Share knowledge and resources
- Follow our Code of Conduct

## Questions?

Feel free to open a discussion or reach out to maintainers!

Thank you for contributing! 🚀

