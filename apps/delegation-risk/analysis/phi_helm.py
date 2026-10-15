import sys, numpy as np, pandas as pd
D=sys.argv[1]
c=pd.read_csv(D+'/helm/model_correlations.csv')
a=pd.read_csv(D+'/helm/model_accuracy.csv').set_index('model')['model_accuracy'].astype(str).str.rstrip('F').astype(float)
o=pd.read_csv(D+'/helm/model_overview.csv').set_index('model string')['company']
BC=c.both_correct_rate; EW=1-BC
S=c.agreement_rate_when_either_wrong*EW
BW=S/c.agreement_rate_when_both_wrong
c['BW']=BW
c['aA']=c.model1.map(a); c['aB']=c.model2.map(a)
c['check']=(c.aA+c.aB)-(1+BC-BW)
print('marginal consistency check |diff| quantiles', c.check.abs().quantile([.5,.9,.99]).round(4).tolist())
pA=1-c.aA; pB=1-c.aB
c['phi']=(BW-pA*pB)/np.sqrt(pA*(1-pA)*pB*(1-pB))
c['same']=c.model1.map(o)==c.model2.map(o)
c['minacc']=np.minimum(c.aA,c.aB)
c['cA']=c.model1.map(o); c['cB']=c.model2.map(o)
def q(x): return f"n={len(x)} median={x.median():.2f} IQR=[{x.quantile(.25):.2f},{x.quantile(.75):.2f}] 10-90=[{x.quantile(.1):.2f},{x.quantile(.9):.2f}]"
print('all', q(c.phi))
print('same company', q(c[c.same].phi))
print('diff company', q(c[~c.same].phi))
for thr in [0.7,0.75,0.8]:
    s=c[c.minacc>=thr]
    print(f'both acc>={thr}: same', q(s[s.same].phi), '| diff', q(s[~s.same].phi))
big=['openai','anthropic','google','meta','qwen','mistralai','deepseek-ai']
s=c[(c.minacc>=0.75)&c.cA.isin(big)&c.cB.isin(big)&~c.same]
print('frontier-ish cross vendor acc>=.75', q(s.phi))
print(s.sort_values('phi')[['model1','model2','aA','aB','phi']].to_string())
s=c[(c.same)&(c.minacc>=0.7)]
print(s.sort_values('phi')[['model1','model2','aA','aB','phi']].tail(15).to_string())
print('----')
pairs=[('openai/gpt-4o-2024-05-13','openai/gpt-4o-2024-08-06'),('anthropic/claude-3-5-sonnet-20240620','anthropic/claude-3-5-sonnet-20241022'),('google/gemini-1.5-pro-001','google/gemini-1.5-pro-002'),('google/gemini-1.5-flash-001','google/gemini-1.5-flash-preview-0514'),('meta/llama-3.1-70b-instruct-turbo','meta/llama-3.2-90b-vision-instruct-turbo'),('openai/gpt-4-0613','openai/gpt-4o-2024-08-06'),('anthropic/claude-3-opus-20240229','anthropic/claude-3-5-sonnet-20241022'),('google/text-unicorn@001','writer/palmyra-x-v3'),('qwen/qwen2-72b-instruct','qwen/qwen2.5-72b-instruct-turbo'),('meta/llama-3.1-405b-instruct-turbo','meta/llama-3.1-70b-instruct-turbo')]
for x,y in pairs:
    r=c[((c.model1==x)&(c.model2==y))|((c.model1==y)&(c.model2==x))]
    print(x,y,r[['aA','aB','phi','agreement_rate_when_both_wrong']].round(3).values.tolist())
s=c[(c.same)&(c.minacc>=0.8)]
print(s.sort_values('phi')[['model1','model2','aA','aB','phi']].round(3).to_string())
# HF same-architecture? skip
print('---- label-noise sensitivity: remove fraction m of items assumed missed by both')
def adj(r,m):
    pa=(1-r.aA-m)/(1-m); pb=(1-r.aB-m)/(1-m); bw=(r.BW-m)/(1-m)
    return (bw-pa*pb)/np.sqrt(pa*(1-pa)*pb*(1-pb))
for m in [0,0.02,0.03,0.05,0.065]:
    s=c[c.minacc>=0.8]
    ph=s.apply(lambda r: adj(r,m),axis=1)
    print(m,'same',round(ph[s.same].median(),2),'diff',round(ph[~s.same].median(),2), 'diff 10-90',ph[~s.same].quantile([.1,.9]).round(2).tolist())
    for x,y in [('openai/gpt-4o-2024-05-13','openai/gpt-4o-2024-08-06'),('anthropic/claude-3-5-sonnet-20240620','anthropic/claude-3-5-sonnet-20241022')]:
        r=c[((c.model1==x)&(c.model2==y))|((c.model1==y)&(c.model2==x))].iloc[0]; print('   ',x.split('/')[1],round(adj(r,m),2))
print('n questions approx: BW counts', c.BW.describe().round(3).to_dict())
print('----range')
s=c[c.minacc>=0.8]
print('diff min/max',s[~s.same].phi.min().round(3),s[~s.same].phi.max().round(3))
for lo,hi in [(0,0.6),(0.6,0.7),(0.7,0.8),(0.8,1)]:
    t=c[(c.minacc>=lo)&(c.minacc<hi)&~c.same]; print(lo,hi,len(t),round(t.phi.median(),2))
