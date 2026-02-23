import sys

vue_file = 'src/ui/TerminalUI.vue'
with open(vue_file, 'r', encoding='utf-8') as f:
    text = f.read()

# 1. Add "mecha" tab
old_str = "list.unshift('pilot'); // Put PILOT first"
if old_str in text:
    text = text.replace(old_str, old_str + "\n            if (this.frame && this.chassis) list.splice(1, 0, 'mecha');")
else:
    print('Failed to find categories hook')
    sys.exit(1)

# 2. Find the mecha-deck and inventory-deck blocks
mecha_start = text.find('<div class="mecha-deck" v-if="frame && chassis">')
training_start = text.find('<div class="training-deck">')

if mecha_start == -1 or training_start == -1:
    print('Could not find mecha boundaries')
    sys.exit(1)

# Grab indentation of mecha_start relative to the line it's on
mecha_line_start = text.rfind('\n', 0, mecha_start)
extracted_content = text[mecha_line_start + 1 : training_start]

# 3. Remove extracted content from pilot console
text = text[:mecha_line_start + 1] + text[training_start:]

# 4. Insert extracted content as a new section
# We place it above FACTIONS AREA
new_section = f'''                <!-- MECHA AREA -->
                <section v-else-if="selectedCategory === 'mecha'" class="pilot-console">
{extracted_content}                </section>

'''

factions_start = text.find('                <!-- FACTIONS AREA -->')
if factions_start == -1:
    print('Could not find factions boundary')
    sys.exit(1)

text = text[:factions_start] + new_section + text[factions_start:]

with open(vue_file, 'w', encoding='utf-8') as f:
    f.write(text)

print("done")
