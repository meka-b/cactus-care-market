import re

with open("backend/server.py", "r", encoding="utf-8") as f:
    content = f.read()

ops = set(re.findall(r'(\$[a-zA-Z]+)', content))
print("Mongo operators used in server.py:", ops)

funcs = set(re.findall(r'db\.\w+\.([a-zA-Z_]+)\(', content))
print("Mongo methods used in server.py:", funcs)

colls = set(re.findall(r'db\.([a-zA-Z_]+)\.', content))
print("Collections used in server.py:", colls)
