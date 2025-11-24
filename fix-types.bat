@echo off
echo Regenerating Prisma Client types...
npx prisma generate
echo.
echo Done! Now restart your TypeScript server in VS Code:
echo 1. Press Ctrl+Shift+P
echo 2. Type "TypeScript: Restart TS Server"
echo 3. Press Enter
pause
