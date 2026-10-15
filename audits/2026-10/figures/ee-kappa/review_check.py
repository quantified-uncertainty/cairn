# Reviewer's independent check (not the builder's script).
import numpy as np
pe=lambda p:p*p+(1-p)**2
k=lambda o,e:(o-e)/(1-e)
print("k(.7,.5)",k(.7,pe(.5)),"k(.7,.8)",k(.7,pe(.8)))
for kk in [.17,.4,.6,.8]: print(kk,[round(pe(p)+kk*(1-pe(p)),4) for p in (.5,.8)])
h=1.96*np.sqrt(.21/50); print("half",h,"kappa lo/hi",k(.7-h,.68),k(.7+h,.68))
# simulate: both raters yes 80%, p_o=0.7 => yes-yes a, a+b=.8 ; a+d=.7, d=.2-b => a+.2-(.8-a)=.7 -> a=.65
rng=np.random.default_rng(1)
def sim(cells,n=50,R=200000):
    c=rng.multinomial(n,cells,R)/n
    a,b,c2,d=c.T; po=a+d; p1=a+b; p2=a+c2; e=p1*p2+(1-p1)*(1-p2)
    with np.errstate(all='ignore'): kap=(po-e)/(1-e)
    kap=kap[np.isfinite(kap)]; return np.percentile(kap,[2.5,50,97.5]), np.percentile(po,[2.5,97.5])
print("true k=.0625:",sim([.65,.15,.15,.05]))
# true k .17 and .4 at pi .8, check page's ±0.3
for kk in (.17,.4):
    o=pe(.8)+kk*(1-pe(.8)); a=(o-.2+.8)/2; b=.8-a
    print(kk,sim([a,b,b,o-a]))
