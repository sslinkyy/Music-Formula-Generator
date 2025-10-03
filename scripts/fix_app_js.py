from pathlib import Path
p = Path('web/app.js')
s = p.read_text(encoding='utf-8', errors='ignore')
# Straight replace known bad fragments
s = s.replace('card.innerHTML = <p><strong>Slot </strong></p>;', 'card.innerHTML = `<p><strong>Slot ${index + 1}</strong></p>`;')
# Replace the GENRE_LIBRARY select build to the proper mapping
s = s.replace(
    'select.innerHTML = <option value="">(none)</option> + GENRE_LIBRARY.map(g => <option value=""></option>).join(\'\');',
    'select.innerHTML = `<option value="">(none)</option>` + GENRE_LIBRARY.map(g => `\n      <option value="${g.name}">${g.name}</option>`).join(\'\');'
)
# Replace PREMISE_OPTIONS select
s = s.replace(
    'select.innerHTML = PREMISE_OPTIONS.map(opt => <option value=""></option>).join(\'\');',
    'select.innerHTML = PREMISE_OPTIONS.map(opt => `\n    <option value="${opt}">${opt}</option>`).join(\'\');'
)
# Replace ACCENT_LIBRARY select
s = s.replace(
    'select.innerHTML = ACCENT_LIBRARY.map(acc => <option value=""></option>).join(\'\');',
    'select.innerHTML = ACCENT_LIBRARY.map(acc => `\n    <option value="${acc.name}">${acc.name}</option>`).join(\'\');'
)
# If the exact strings didn't match due to spacing/newlines, patch via simple patterns:
s = s.replace('card.innerHTML = <p><strong>Slot ', 'card.innerHTML = `\n      <p><strong>Slot ${index + 1}</strong></p>`;\n      // ')
s = s.replace('select.innerHTML = <option value="">(none)</option> + GENRE_LIBRARY.map', 'select.innerHTML = `<option value="">(none)</option>` + GENRE_LIBRARY.map')
s = s.replace('g => <option value=""></option>)', 'g => `\n      <option value="${g.name}">${g.name}</option>`)')
s = s.replace('PREMISE_OPTIONS.map(opt => <option value=""></option>)', 'PREMISE_OPTIONS.map(opt => `\n    <option value="${opt}">${opt}</option>`)')
s = s.replace('ACCENT_LIBRARY.map(acc => <option value=""></option>)', 'ACCENT_LIBRARY.map(acc => `\n    <option value=\"${acc.name}\">${acc.name}</option>`)')
# Write back
p.write_text(s, encoding='utf-8')
print('done')
