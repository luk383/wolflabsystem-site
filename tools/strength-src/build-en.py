import re,sys,os,shutil
sys.path.insert(0,os.path.dirname(__file__))
from en import EN
try:
    from en_method import EN as EM; EN={**EN,**EM}
except ImportError: pass
out=sys.argv[1]; os.makedirs(out,exist_ok=True)
for f in ['App.tsx','MethodCard.tsx','shim.tsx','main.tsx','style.css']:
    s=open(f).read()
    if f in('App.tsx','MethodCard.tsx','shim.tsx'):
        for k in sorted(EN,key=len,reverse=True):
            v=re.sub(r"(?<=[A-Za-z])'(?=[a-z])","’",EN[k])
            if len(k)>22 or k.endswith(' ') or k.startswith(' '):
                s=s.replace(k,v)
            else:
                s=re.sub(r"(?<=['\">`])"+re.escape(k)+r"(?=['\"<`])",lambda m:v,s)
        s=s.replace("wolf-workout-demo.v1","wolf-workout-demo.en.v1")
    open(os.path.join(out,f),'w').write(s)
