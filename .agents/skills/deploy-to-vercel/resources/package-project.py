"""Create a deployment archive without private/ignored files. Never extract input archives."""
import fnmatch
import io
import os
import re
import stat
import sys
import tarfile
from pathlib import Path, PurePosixPath

PRIVATE_DIRS = {'.git', '.local', '.vercel', '.next', '.impeccable', 'node_modules', '.codex'}
PRIVATE_NAMES = {'keys.txt', 'secrets.txt', 'config.local.ts', 'temp-config.ts'}
PRIVATE_SUFFIXES = {'.pem', '.key', '.cert', '.crt', '.secret', '.dump', '.bak', '.sqlite', '.db'}


def safe_name(name):
    if '\\' in name or ':' in name or name.startswith('/') or '..' in name.split('/'):
        raise ValueError('Unsafe archive path')
    if any(part not in {'.', ''} and (part.endswith(' ') or part.endswith('.')) for part in name.split('/')):
        raise ValueError('Ambiguous cross-platform archive path')
    return str(PurePosixPath(name))


def private(name):
    # Archives can originate on Windows, where these names alias lowercase paths.
    parts = [part.casefold() for part in PurePosixPath(name).parts]
    return any(part in PRIVATE_DIRS for part in parts) or any(
        part == '.env' or part.startswith('.env.') or part in PRIVATE_NAMES
        or Path(part).suffix.lower() in PRIVATE_SUFFIXES for part in parts)


def linked(file):
    metadata = file.lstat()
    return stat.S_ISLNK(metadata.st_mode) or bool(getattr(metadata, 'st_file_attributes', 0) & 0x400)


def glob_regex(pattern):
    # A path component glob cannot cross '/', while ** can cross directories.
    pieces = pattern.split('/')
    result = ''
    for index, piece in enumerate(pieces):
        if piece == '**':
            result += '(?:.*/)?' if index < len(pieces) - 1 else '.*'
        else:
            translated = fnmatch.translate(piece)
            result += translated[4:-3]
            if index < len(pieces) - 1:
                result += '/'
    return result


def ignore_rules(files):
    rules = []
    # Nested .gitignore files apply after their parent; deployment exclusions last.
    names = sorted((n for n in files if PurePosixPath(n).name == '.gitignore'), key=lambda n: n.count('/'))
    names += [n for n in files if PurePosixPath(n).name == '.vercelignore']
    for name in names:
        base = str(PurePosixPath(name).parent)
        base = '' if base == '.' else base + '/'
        for raw in files[name].decode('utf-8-sig').splitlines():
            pattern = raw.rstrip()
            if not pattern or pattern.startswith('#'):
                continue
            negate = pattern.startswith('!')
            if negate:
                pattern = pattern[1:]
            anchored = pattern.startswith('/')
            pattern = pattern.lstrip('/').rstrip('/')
            if not pattern:
                continue
            prefix = re.escape(base)
            if not anchored and '/' not in pattern:
                prefix += '(?:.*/)?'
            rules.append((re.compile('^' + prefix + glob_regex(pattern) + '(?:/.*)?$'), negate))
    return rules


def ignored(name, rules):
    # Git cannot re-include a file while its parent directory is still ignored.
    parents = [str(p) for p in reversed(PurePosixPath(name).parents) if str(p) != '.']
    for candidate in parents + [name]:
        excluded = False
        for pattern, negate in rules:
            if pattern.fullmatch(candidate):
                excluded = not negate
        if excluded:
            return True
    return False


def package(source, destination):
    source, destination = Path(source), Path(destination)
    files = {}
    directory_input = source.is_dir()
    if directory_input:
        root = source.resolve()
        if destination.resolve().is_relative_to(root):
            raise ValueError('Package output must be outside source')
        for parent, dirs, names in os.walk(root, followlinks=False):
            dirs[:] = [d for d in dirs if not private(Path(parent, d).relative_to(root).as_posix())]
            if any(linked(Path(parent, d)) for d in dirs):
                raise ValueError('Directory links cannot be deployed')
            for leaf in names:
                file = Path(parent, leaf)
                name = safe_name(file.relative_to(root).as_posix())
                if private(name):
                    continue
                # No symlink is followed, including a directory alias to private data.
                if linked(file) or not file.is_file():
                    raise ValueError('Links and special files cannot be deployed')
                files[name] = file.read_bytes()
    else:
        with tarfile.open(source, 'r:gz') as archive:
            for member in archive:
                name = safe_name(member.name)
                if member.isdir():
                    continue
                if not member.isfile() or name in files:
                    raise ValueError('Unsafe or duplicate archive member')
                if not private(name):
                    stream = archive.extractfile(member)
                    if stream is None:
                        raise ValueError('Unreadable archive member')
                    files[name] = stream.read()
    rules = ignore_rules(files)
    selected = {}
    for name, content in files.items():
        if not ignored(name, rules) and not private(name):
            selected[name] = content
    if directory_input and 'package.json' not in files:
        html = [n for n in selected if '/' not in n and n.endswith('.html')]
        if len(html) == 1 and html[0] != 'index.html':
            selected['index.html'] = selected.pop(html[0])
    if not selected:
        raise ValueError('No deployable source files')
    with tarfile.open(destination, 'w:gz') as archive:
        for name, content in selected.items():
            info = tarfile.TarInfo(name)
            info.size = len(content)
            info.mode = 0o644
            archive.addfile(info, io.BytesIO(content))


if __name__ == '__main__':
    try:
        package(*sys.argv[1:])
    except Exception:
        # Never echo archive contents, private paths, or credential values.
        print('Deployment packaging failed: unsafe input or unreadable ignore rules.', file=sys.stderr)
        sys.exit(1)
