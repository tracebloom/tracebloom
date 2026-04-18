"""tracebloom command-line interface."""

from __future__ import annotations

import sys

import click

from tracebloom import __version__


@click.group(invoke_without_command=True, context_settings={"help_option_names": ["-h", "--help"]})
@click.version_option(__version__, "-V", "--version", message="%(version)s")
@click.pass_context
def main(ctx: click.Context) -> None:
    """tracebloom: a debugger for AI agents."""
    if ctx.invoked_subcommand is None:
        click.echo(ctx.get_help())


@main.command()
def demo() -> None:
    """Run the interactive demo (coming in v0.1.0)."""
    click.echo("coming in v0.1.0 (Phase 2)")


@main.command()
def doctor() -> None:
    """Print environment diagnostics."""
    py = ".".join(str(v) for v in sys.version_info[:3])
    click.echo(f"Python: {py} | tracebloom: {__version__} | viewer bundled: no")


if __name__ == "__main__":
    main()
