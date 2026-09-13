# -*- coding: utf-8 -*-
"""본문 보강 검증 스크립트 (docs/adsense-content-plan.md 작업용)

사용법:
  python3 scripts/check_content.py savings.html guide-isa-account.html   # 글자 수 + 검증
  python3 scripts/check_content.py --sync-faq savings.html               # 본문 FAQ → FAQPage JSON-LD 재생성
글자 수는 계산기(section.article-section) / 가이드(article.article-body) 본문의 공백 제외 문자 수.
검증: 태그 균형, AD SLOT 2개, 애드센스 스크립트 1개, canonical=파일명, JSON-LD 파싱, og:title=title,
      nav 11개, 내부 링크 존재, PII/github 금지, FAQ 수=JSON-LD 수, datePublished=article-meta 날짜(가이드).
"""
import re, json, html, os, sys
from html.parser import HTMLParser
REPO=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
VOID={'meta','link','br','img','input','hr','source','wbr','area','base','col','embed','param','track'}

def replace_section(page, new_html):
    p=os.path.join(REPO,page); s=open(p,encoding='utf-8').read()
    a=s.index('  <section class="article-section">'); b=s.index('  </section>',a)+len('  </section>')
    s=s[:a]+new_html.strip('\n')+s[b:]
    open(p,'w',encoding='utf-8').write(s)

def sync_faq(page):
    """FAQPage JSON-LD를 본문 .faq-item 에서 재생성"""
    p=os.path.join(REPO,page); s=open(p,encoding='utf-8').read()
    items=re.findall(r'<p class="q">Q\.\s*(.*?)</p>\s*<p class="a">A\.\s*(.*?)</p>',s,re.S)
    def clean(t): return html.unescape(re.sub(r'<[^>]+>','',t)).strip()
    ld={"@context":"https://schema.org","@type":"FAQPage","mainEntity":[{"@type":"Question","name":clean(q),"acceptedAnswer":{"@type":"Answer","text":clean(a)}} for q,a in items]}
    new='<script type="application/ld+json">'+json.dumps(ld,ensure_ascii=False)+'</script>'
    s2,n=re.subn(r'<script type="application/ld\+json">\{"@context":"https://schema.org","@type":"FAQPage".*?</script>',lambda m:new,s,count=1,flags=re.S)
    assert n==1,'FAQPage ld not found in '+page
    open(p,'w',encoding='utf-8').write(s2); return len(items)

def count_chars(page):
    s=open(os.path.join(REPO,page),encoding='utf-8').read()
    m=re.search(r'<article class="article-body">(.*?)</article>',s,re.S) or re.search(r'<section class="article-section"[^>]*>(.*?)</section>',s,re.S)
    if not m:
        m=re.search(r'<main[^>]*>(.*?)</main>',s,re.S)
    t=re.sub(r'<script.*?</script>','',m.group(1),flags=re.S)
    t=html.unescape(re.sub(r'<[^>]+>','',t))
    return len(re.sub(r'\s+','',t))

class Bal(HTMLParser):
    def __init__(s): super().__init__(); s.st=[]; s.err=[]
    def handle_starttag(s,t,a):
        if t not in VOID: s.st.append(t)
    def handle_startendtag(s,t,a): pass
    def handle_endtag(s,t):
        if t in VOID: return
        if not s.st or s.st[-1]!=t: s.err.append('close %s but open %s'%(t,s.st[-1] if s.st else None))
        else: s.st.pop()

def validate(page):
    p=os.path.join(REPO,page); s=open(p,encoding='utf-8').read(); errs=[]
    b=Bal(); b.feed(s)
    if b.err or b.st: errs.append('tag balance: %s %s'%(b.err[:3],b.st[:3]))
    dp=re.search(r'"datePublished":"([0-9-]+)"',s); meta=re.search(r'article-meta">.*?· ([0-9]{4}-[0-9]{2}-[0-9]{2}) 기준',s)
    if dp and meta and dp.group(1)!=meta.group(1): errs.append('datePublished %s != article-meta %s'%(dp.group(1),meta.group(1)))
    dm=re.search(r'"dateModified":"([0-9-]+)"',s)
    if dp and dm and dm.group(1)<dp.group(1): errs.append('dateModified before datePublished')
    if s.count('<!-- AD SLOT -->')!=2: errs.append('AD SLOT count %d'%s.count('<!-- AD SLOT -->'))
    if s.count('adsbygoogle.js')!=1: errs.append('adsense script count')
    m=re.search(r'<link rel="canonical" href="https://money-tools.org/([^"]+)">',s)
    if not m or m.group(1)!=page: errs.append('canonical')
    for ld in re.findall(r'<script type="application/ld\+json">(.*?)</script>',s,re.S):
        try: json.loads(ld)
        except Exception as e: errs.append('jsonld: %s'%e)
    t=re.search(r'<title>(.*?)</title>',s,re.S).group(1); og=re.search(r'og:title" content="(.*?)"',s).group(1)
    if t!=og: errs.append('og:title != title')
    nav=re.search(r'<nav class="site-nav">(.*?)</nav>',s,re.S).group(1)
    if nav.count('<a ')!=11: errs.append('nav count %d'%nav.count('<a '))
    if re.search(r'github\.io|yeonghwi|victor_14',s): errs.append('PII/github')
    for h in re.findall(r'(?:href|src)="([^"#:]+)"',s):
        f=h.split('?')[0]
        if f and not os.path.exists(os.path.join(REPO,f.lstrip('/'))): errs.append('missing link '+h)
    faq=len(re.findall(r'<p class="q">',s)); ld=re.search(r'"@type":"FAQPage","mainEntity":(\[.*?\])\}</script>',s)
    if ld and len(json.loads(ld.group(1)))!=faq: errs.append('faq ld mismatch')
    return errs

if __name__=='__main__':
    args=sys.argv[1:]
    if args and args[0]=='--sync-faq':
        for pg in args[1:]: print(pg,'faq items ->',sync_faq(pg))
    else:
        bad=0
        for pg in args:
            e=validate(pg); bad+=bool(e); print(pg, count_chars(pg), e or 'OK')
        sys.exit(1 if bad else 0)
