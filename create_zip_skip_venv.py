import os
import zipfile

src_dir = r'C:\Users\CASAIS\GRKK\backend'
zip_path = r'C:\Users\CASAIS\GRKK\backend_clean.zip'

with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
    for root, dirs, files in os.walk(src_dir):
        # Skip .venv directory
        if '.venv' in dirs:
            dirs.remove('.venv')
        for file in files:
            file_path = os.path.join(root, file)
            # Compute archive name relative to src_dir
            arcname = os.path.relpath(file_path, start=src_dir)
            zipf.write(file_path, arcname)
print('ZIP created at:', zip_path)
