@echo off
setlocal enabledelayedexpansion

REM Ensure symbols folder exists
if not exist "symbols" (
  echo symbols folder not found.
  exit /b 1
)

REM Build JSON array of image filenames (flat, not recursive)
set "list="
for %%F in (symbols\*.png symbols\*.jpg symbols\*.jpeg symbols\*.svg symbols\*.webp) do (
  if exist "%%F" (
    set "name=%%~nxF"
    if defined list (
      set "list=!list!,\"!name!\""
    ) else (
      set "list=\"!name!\""
    )
  )
)

REM Write JSON
if not exist "symbols" mkdir "symbols"
> "symbols\index.json" echo {^
  "symbols": [!list!]^
}

echo Generated symbols\index.json
endlocal