@echo off
REM MGrep Helper for GLPal Project
REM Usage: mgrep.bat "search term" or mgrep.bat for interactive mode

if "%1"=="" (
    node mgrep.js
) else (
    node mgrep.js %*
)