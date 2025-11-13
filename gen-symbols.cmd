@echo off
setlocal enabledelayedexpansion

if not exist "symbols" (
  echo symbols folder not found.
  exit /b 1
)

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

> "symbols\index.json" echo {^
  "symbols": [!list!]^
}

echo Generated symbols\index.json
endlocal