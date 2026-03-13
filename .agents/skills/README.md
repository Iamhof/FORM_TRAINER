# Skills

Skills are folders of instructions, scripts, and resources that extend the agent's capabilities for specialized tasks.

## Anatomy of a Skill

Each skill should have its own folder containing at least:
- `SKILL.md` (required): The main instruction file with YAML frontmatter (name, description) and detailed markdown instructions.

More complex skills may include additional directories and files as needed, for example:
- `scripts/`: Helper scripts and utilities that extend capabilities.
- `examples/`: Reference implementations and usage patterns.
- `resources/`: Additional files, templates, or assets the skill may reference.

## Example

```
example_skill/
├── SKILL.md
├── scripts/
│   └── helper.sh
└── examples/
    └── example_usage.txt
```
