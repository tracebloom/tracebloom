"""Smoke tests: the scaffold is alive."""

from __future__ import annotations

from click.testing import CliRunner
from tracebloom import __version__
from tracebloom.cli import main


def test_version_constant() -> None:
    assert __version__ == "0.0.1"


def test_cli_help() -> None:
    runner = CliRunner()
    result = runner.invoke(main, ["--help"])
    assert result.exit_code == 0
    assert "tracebloom" in result.output.lower()


def test_cli_version() -> None:
    runner = CliRunner()
    result = runner.invoke(main, ["--version"])
    assert result.exit_code == 0
    assert __version__ in result.output


def test_demo_exits_zero() -> None:
    runner = CliRunner()
    result = runner.invoke(main, ["demo"])
    assert result.exit_code == 0
    assert "coming in v0.1.0" in result.output


def test_doctor_exits_zero() -> None:
    runner = CliRunner()
    result = runner.invoke(main, ["doctor"])
    assert result.exit_code == 0
    assert f"tracebloom: {__version__}" in result.output
    assert "viewer bundled: no" in result.output
