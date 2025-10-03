import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
source_path = ROOT / 'RGF_Module.bas'
src = source_path.read_text(encoding='utf-8')

web_dir = ROOT / 'web'
data_dir = web_dir / 'data'
data_dir.mkdir(parents=True, exist_ok=True)

def parse_args(arg_str):
    args = []
    current = ''
    in_string = False
    i = 0
    while i < len(arg_str):
        ch = arg_str[i]
        if in_string:
            if ch == '"':
                if i + 1 < len(arg_str) and arg_str[i + 1] == '"':
                    current += '"'
                    i += 1
                else:
                    args.append(('str', current))
                    current = ''
                    in_string = False
            else:
                current += ch
        else:
            if ch == '"':
                in_string = True
            elif ch == ',':
                if current.strip():
                    token = current.strip()
                    if token.endswith('_'):
                        token = token[:-1].rstrip()
                    try:
                        value = float(token)
                        args.append(('num', value))
                    except ValueError:
                        args.append(('raw', token))
                current = ''
            else:
                current += ch
        i += 1
    if in_string:
        raise ValueError('Unterminated string in argument list: ' + arg_str)
    if current.strip():
        token = current.strip()
        if token.endswith('_'):
            token = token[:-1].rstrip()
        try:
            value = float(token)
            args.append(('num', value))
        except ValueError:
            args.append(('raw', token))
    return [value for _, value in args]


def extract_calls(keyword):
    prefix = f'{keyword} ws, r,'
    results = []
    for line in src.splitlines():
        stripped = line.strip()
        if stripped.startswith(prefix):
            arg_str = stripped[len(prefix):].strip()
            results.append(parse_args(arg_str))
    return results


genre_rows = extract_calls('AddGenreRow')
accent_rows = extract_calls('AddAccentRow')

# Build genres JS
genre_items = []
for row in genre_rows:
    if len(row) != 15:
        raise ValueError(f'Unexpected genre row length {len(row)} for {row}')
    genre_items.append({
        'name': row[0],
        'tempo': row[1],
        'styleTags': row[2],
        'structure': row[3],
        'exclude': row[4],
        'sfx': row[5],
        'weights': {
            'core': row[6],
            'tech': row[7],
            'anthem': row[8],
            'style': row[9],
            'group': row[10],
            'perf': row[11],
        },
        'hookPlan': row[12],
        'flowPlan': row[13],
        'rhymePlan': row[14],
    })

accent_items = []
for row in accent_rows:
    if len(row) != 3:
        raise ValueError(f'Unexpected accent row length {len(row)} for {row}')
    accent_items.append({
        'name': row[0],
        'instruction': row[1],
        'styleTag': row[2],
    })

header = '// Auto-generated from VBA module by scripts/extract_web_data.py\n'

genre_js = header + 'export const GENRE_LIBRARY = ' + json.dumps(genre_items, indent=2) + ';\n'
accent_js = header + 'export const ACCENT_LIBRARY = ' + json.dumps(accent_items, indent=2) + ';\n'

(data_dir / 'genres.js').write_text(genre_js, encoding='utf-8')
(data_dir / 'accents.js').write_text(accent_js, encoding='utf-8')

print(f'Extracted {len(genre_items)} genres and {len(accent_items)} accents.')
