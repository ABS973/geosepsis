(function(root){
'use strict';
const N=8, EPS=.08, WINDOW=36, LIMIT=180;
const labels=['HR','RR','SpO₂','Temp','SBP','DBP','MAP','PP'];
const units=['bpm','/min','%','°C','mmHg','mmHg','mmHg','mmHg'];
const names=['Heart rate','Respiratory rate','Oxygen saturation','Temperature','Systolic pressure','Diastolic pressure','Mean arterial pressure','Pulse pressure'];
const identity=n=>Array.from({length:n},(_,i)=>Array.from({length:n},(_,j)=>+(i===j)));
const transpose=a=>a[0].map((_,j)=>a.map(r=>r[j]));
const mul=(a,b)=>a.map(r=>b[0].map((_,j)=>r.reduce((s,v,k)=>s+v*b[k][j],0)));
function eigen(input){const a=input.map(r=>r.slice()),n=a.length,v=identity(n);let converged=false;
 for(let iter=0;iter<100*n*n;iter++){let p=0,q=1,max=0;for(let i=0;i<n;i++)for(let j=i+1;j<n;j++)if(Math.abs(a[i][j])>max){max=Math.abs(a[i][j]);p=i;q=j;}
 if(max<1e-11){converged=true;break;}const phi=.5*Math.atan2(2*a[p][q],a[q][q]-a[p][p]),c=Math.cos(phi),s=Math.sin(phi),pp=a[p][p],qq=a[q][q],pq=a[p][q];
 for(let k=0;k<n;k++)if(k!==p&&k!==q){const kp=a[k][p],kq=a[k][q];a[k][p]=a[p][k]=c*kp-s*kq;a[k][q]=a[q][k]=s*kp+c*kq;}
 a[p][p]=c*c*pp-2*s*c*pq+s*s*qq;a[q][q]=s*s*pp+2*s*c*pq+c*c*qq;a[p][q]=a[q][p]=0;
 for(let k=0;k<n;k++){const x=v[k][p],y=v[k][q];v[k][p]=c*x-s*y;v[k][q]=s*x+c*y;}}
 if(!converged)throw Error('Eigensolver did not converge');const values=a.map((r,i)=>r[i]);if(values.some(x=>!Number.isFinite(x)))throw Error('Nonfinite spectrum');return {values,vectors:v};}
function power(a,p){const e=eigen(a);if(e.values.some(x=>x<=0))throw Error('Matrix is not positive definite');return mul(e.vectors.map(r=>r.map((x,j)=>x*Math.pow(e.values[j],p))),transpose(e.vectors));}
function distance(a,b){const inv=power(a,-.5),c=mul(mul(inv,b),inv);const e=eigen(c).values;if(e.some(x=>x<=0))throw Error('Invalid relative SPD state');return Math.sqrt(e.reduce((s,x)=>s+Math.log(x)**2,0));}
const mean=rows=>rows[0].map((_,i)=>rows.reduce((s,r)=>s+r[i],0)/rows.length);
function covariance(rows,eps=EPS){const m=mean(rows);return m.map((_,i)=>m.map((_,j)=>rows.reduce((s,r)=>s+(r[i]-m[i])*(r[j]-m[j]),0)/(rows.length-1)+(i===j?eps:0)));}
const correlation=a=>a.map((r,i)=>r.map((x,j)=>x/Math.sqrt(a[i][i]*a[j][j])));
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
class DataSource{next(){throw Error('Implement next()');}}
class MAX30102DataSource extends DataSource{next(){throw Error('Hardware adapter requires a local acquisition bridge; exhibition uses simulation');}}
class SimulationDataSource extends DataSource{
 constructor(random=Math.random,scenario='gradual'){super();this.random=random;this.scenario=scenario;this.pace=.9+random()*.2;this.n=0;this.latent=Array(6).fill(0);
  const r=(a,b)=>a+(b-a)*random(),hr=r(68,84),rr=r(13,18),o=r(96.5,99.2),temp=r(36.5,37.1),sbp=r(108,126),dbp=clamp(r(66,82)+.2*(sbp-117),64,84);
  this.base=[hr,rr,o,temp,sbp,dbp,(sbp+2*dbp)/3,sbp-dbp];
  this.shift=[r(.82,1.18),r(.8,1.2),r(.85,1.15),r(.8,1.2),r(.82,1.18),r(.82,1.18)];
  this.sign=random()<.5?-1:1;
 }
 normal(){return Math.sqrt(-2*Math.log(Math.max(1e-12,this.random())))*Math.cos(2*Math.PI*this.random());}
 progress(t){if(this.scenario==='healthy')return 0;if(this.scenario==='rapid')return clamp((t-7)/(31*this.pace),0,1);if(this.scenario==='noisy')return 0;return clamp((t-15)/(145*this.pace),0,1);}
 next(t=0){this.n++;const d=this.progress(t),noisy=this.scenario==='noisy',healthy=this.scenario==='healthy',z=Array.from({length:8},()=>this.normal());
  this.latent=this.latent.map((x,i)=>.72*x+(noisy?.78:healthy?.46:.55+Math.min(.2,d))*z[i]);
  const f=this.latent[0],b=this.latent[1],v=this.latent[2],slow=this.latent[3],stableAmp=noisy?2.25:healthy?.82:1+d*1.7;
  const target=[
   this.base[0]+10.5*d*this.shift[0]+stableAmp*(1.25*z[4]+(.22+2.5*d)*f),
   this.base[1]+2.8*d*this.shift[1]+stableAmp*(.48*z[5]+(.1+.96*d)*f),
   this.base[2]-.95*d*this.shift[2]+(noisy?.32:.16)*z[6]-(.02+.26*d)*f,
   this.base[3]+.62*d*this.shift[3]+(noisy?.045:.028)*z[7]+(.012+.14*d)*slow,
   this.base[4]-8.8*d*this.shift[4]+1.7*v+1.25*b-3.7*d*f,
   this.base[5]-4.2*d*this.shift[5]+1.0*v+.95*b-1.9*d*f
  ];
  const hr=clamp(target[0],52,135),rr=clamp(target[1],9,30),o=clamp(target[2],91,100),temp=clamp(target[3],35.5,39.5),sbp=clamp(target[4],88,145),dbp=clamp(target[5],52,95);
  return [hr,rr,o,temp,sbp,dbp,(sbp+2*dbp)/3,sbp-dbp];}}
class Engine{
 constructor(random=Math.random,scenario='gradual'){this.random=random;this.scenario=scenario;this.source=new SimulationDataSource(random,scenario);this.t=0;this.id=null;this.events=[];this.warning=false;this.history=[];this.states=[];this.peak=0;
 const baseline=Array.from({length:720},()=>this.source.next());this.mu=mean(baseline);const c=covariance(baseline,0);this.sd=c.map((r,i)=>Math.sqrt(r[i]));this.standardize=r=>r.map((x,i)=>(x-this.mu[i])/this.sd[i]);this.ref=covariance(baseline.map(this.standardize));this.window=baseline.slice(-WINDOW);this.vitals=mean(this.window);this.matrix=this.ref.map(r=>r.slice());this.d=0;this.rate=0;this.persistence=0;this.risk=this.score();this.baselineMean=0;
 const ds=[];for(let i=0;i+WINDOW<=baseline.length;i+=WINDOW)ds.push(distance(this.ref,covariance(baseline.slice(i,i+WINDOW).map(this.standardize))));this.baselineMean=ds.reduce((a,b)=>a+b,0)/ds.length;this.criterion=Math.max(2.5,this.baselineMean*2.4);this.raw=baseline.slice(-60).map((v,i)=>({t:i-59,v}));this.record();this.log('Baseline reference established');}
 log(message){this.events.unshift({t:this.t,message});this.events=this.events.slice(0,60);}
 score(){return Math.round(100/(1+Math.exp(-(1.1*this.d+2*Math.max(0,this.rate)+1.8*this.persistence-4.4))));}
 record(){this.peak=Math.max(this.peak,this.d);this.states.push({t:this.t,d:this.d,v:this.vitals.slice(),matrix:this.matrix.map(r=>r.slice()),risk:this.risk});if(this.t===0)this.baselineState=this.states[0];this.states=this.states.slice(-LIMIT);}
 step(){this.t++;const v=this.source.next(this.t);this.window.push(v);this.window=this.window.slice(-WINDOW);this.vitals=v;this.raw.push({t:this.t,v});this.raw=this.raw.slice(-LIMIT);
 const m=covariance(this.window.map(this.standardize));if(eigen(m).values.some(x=>x<=0))throw Error('SPD verification failed');const d=distance(this.ref,m);this.rate=d-this.d;this.d=d;this.matrix=m;this.history.push({t:this.t,d});this.history=this.history.slice(-LIMIT);const recent=this.history.slice(-10);this.persistence=recent.filter(x=>x.d>this.criterion).length/10;this.risk=this.score();
 const warn=this.d>this.criterion&&this.persistence>=.8;if(warn&&!this.warning)this.log('Prototype early-warning criterion reached');if(this.d>this.criterion&&!this.events.some(x=>x.message==='Covariance structure shift observed'))this.log('Covariance structure shift observed');if(this.t===1)this.log('SPD state verified');this.warning=warn;this.record();return this;}
 changes(){return this.matrix.flatMap((r,i)=>r.map((x,j)=>({i,j,value:x-this.ref[i][j]})).filter(x=>x.j>x.i)).sort((a,b)=>Math.abs(b.value)-Math.abs(a.value));}
 start(){if(!this.id){this.id='GS-'+String(Math.floor(this.random()*9000)+1000);this.log('Analysis started · '+this.scenarioLabel().toLowerCase()+' scenario');}return this;}
 scenarioLabel(){return ({healthy:'Healthy / Stable',gradual:'Gradual Deterioration',rapid:'Rapid Deterioration',noisy:'Noisy but Stable'})[this.scenario]||'Gradual Deterioration';}
}
root.GeoMath={Engine,DataSource,SimulationDataSource,MAX30102DataSource,eigen,power,distance,covariance,correlation,mul,transpose,identity,labels,units,names,EPS,WINDOW,clamp};
})(globalThis);
