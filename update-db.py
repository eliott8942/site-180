import os
from pathlib import Path
import shutil

for dirpath, dirnames, filenames in os.walk('assets/images/'):
  for dirname in dirnames:
    file_full_path = os.path.join(dirpath, dirname)
    file_full_path = file_full_path[14:]

    dir_path = 'content/french/' + file_full_path
    if os.path.exists(dir_path + '.md'):
      os.mkdir(dir_path)
      shutil.copy2(dir_path + '.md', os.path.join(dir_path, 'index.md'))
      shutil.copytree(os.path.join(dirpath, dirname), os.path.join(dir_path), dirs_exist_ok=True)

  for filename in filenames:
    file_full_path = os.path.join(dirpath, Path(filename).stem)
    file_full_path = file_full_path[14:]

    dir_path = 'content/french/' + file_full_path
    if os.path.exists(dir_path + '.md'):
      print(dir_path)
      os.mkdir(dir_path)
      shutil.copy2(dir_path + '.md', os.path.join(dir_path, 'index.md'))
      shutil.copy2(os.path.join(dirpath, filename), os.path.join(dir_path, Path(filename)))

    