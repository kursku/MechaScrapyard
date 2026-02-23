import json
import os

files = ['skills', 'zones', 'jobs', 'missions', 'factions', 'player', 'homes']

for f in files:
    head_path = f'head_{f}.json'
    curr_path = f'data/mecha/{f}.json'
    
    if not os.path.exists(head_path) or not os.path.exists(curr_path):
        continue
        
    try:
        with open(head_path, 'r', encoding='utf-8') as fh:
            head_data = json.load(fh)
    except Exception as e:
        print(f"Failed to read head_{f}: {e}")
        continue
        
    try:
        with open(curr_path, 'r', encoding='utf-8') as fc:
            curr_data = json.load(fc)
    except Exception as e:
        print(f"Failed to read data/mecha/{f}: {e}")
        continue

    # Create mapping from ID to head items to support reordered arrays
    if isinstance(curr_data, list) and isinstance(head_data, list):
        head_map = {item.get('id', str(i)): item for i, item in enumerate(head_data)}
        
        for i, curr_item in enumerate(curr_data):
            key = curr_item.get('id', str(i))
            if key in head_map:
                h_item = head_map[key]
                if 'icon' in h_item:
                    curr_item['icon'] = h_item['icon']
                if 'flavor' in h_item:
                    curr_item['flavor'] = h_item['flavor']
                    
    elif isinstance(curr_data, dict) and isinstance(head_data, dict):
        for k, v in curr_data.items():
            if k in head_data and isinstance(head_data[k], dict):
                h_item = head_data[k]
                if 'icon' in h_item:
                    v['icon'] = h_item['icon']
                if 'flavor' in h_item:
                    v['flavor'] = h_item['flavor']

    with open(curr_path, 'w', encoding='utf-8') as fc:
        json.dump(curr_data, fc, indent=2)
    print(f"Restored icons for {f}.json")
