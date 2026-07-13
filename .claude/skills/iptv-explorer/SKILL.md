```markdown
# iptv-explorer Development Patterns

> Auto-generated skill from repository analysis

## Overview
This skill teaches the core development patterns and conventions used in the `iptv-explorer` TypeScript codebase. It covers file naming, import/export styles, commit message conventions, and testing patterns. The repository does not use a framework and follows a clear, conventional commit workflow with a focus on maintainability and clarity.

## Coding Conventions

### File Naming
- **PascalCase** is used for file names.
  - Example: `ChannelList.ts`, `IptvParser.ts`

### Import Style
- **Alias imports** are preferred.
  - Example:
    ```typescript
    import { Channel } from '@models/Channel';
    ```

### Export Style
- **Mixed export style**: Both named and default exports are used.
  - Named export:
    ```typescript
    export function parsePlaylist(data: string): Playlist { ... }
    ```
  - Default export:
    ```typescript
    export default IptvParser;
    ```

### Commit Messages
- **Conventional commits** with the `feat` prefix.
  - Example: `feat: add support for M3U playlists`

## Workflows

### Feature Development
**Trigger:** When adding a new feature  
**Command:** `/feature-development`

1. Create a new branch for your feature.
2. Write code following the coding conventions above.
3. Use PascalCase for new files.
4. Use alias imports for dependencies.
5. Export modules using named or default exports as appropriate.
6. Commit changes with a message starting with `feat:`.
7. Open a pull request for review.

### Testing
**Trigger:** When writing or updating tests  
**Command:** `/run-tests`

1. Create or update test files with the `.test.` pattern (e.g., `ChannelList.test.ts`).
2. Write tests for new or changed functionality.
3. Run the test suite using the project's test runner.
4. Ensure all tests pass before merging.

## Testing Patterns

- Test files are named with the `.test.` infix, e.g., `Parser.test.ts`.
- The testing framework is not specified, but standard TypeScript testing patterns apply.
- Example test file:
  ```typescript
  import { parsePlaylist } from '@utils/Parser';

  describe('parsePlaylist', () => {
    it('should parse a valid M3U playlist', () => {
      const data = '#EXTM3U\n#EXTINF:0,Channel\nhttp://example.com/stream';
      const result = parsePlaylist(data);
      expect(result.channels.length).toBe(1);
    });
  });
  ```

## Commands
| Command              | Purpose                                  |
|----------------------|------------------------------------------|
| /feature-development | Start a new feature development workflow |
| /run-tests           | Run the test suite                       |
```
