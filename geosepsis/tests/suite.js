globalThis.runGeoTests=function(){const G=GeoMath,results=[];let passed=0,failed=0;
function test(name,fn){try{fn();passed++;results.push('PASS '+name);}catch(e){failed++;results.push('FAIL '+name+': '+e.message);}}
function assert(x,m='assertion failed'){if(!x)throw Error(m);}function near(a,b,tol=1e-7){assert(Math.abs(a-b)<tol,`${a} != ${b}`);}
function rng(seed){return ()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};}
test('Unbiased covariance known sample',()=>{const c=G.covariance([[1,2],[2,4],[3,6]],0);near(c[0][0],1);near(c[0][1],2);near(c[1][1],4);});
test('Jacobi reconstructs symmetric matrix',()=>{const a=[[4,1,2],[1,3,.5],[2,.5,5]],e=G.eigen(a),r=G.mul(e.vectors.map(row=>row.map((v,j)=>v*e.values[j])),G.transpose(e.vectors));a.forEach((row,i)=>row.forEach((v,j)=>near(v,r[i][j])));});
test('Distance identity / known diagonal answer',()=>{near(G.distance([[2,0],[0,3]],[[2,0],[0,3]]),0);near(G.distance(G.identity(2),[[Math.E,0],[0,Math.E**2]]),Math.sqrt(5));});
test('Affine invariance and symmetry',()=>{const a=[[2,.3],[.3,1]],b=[[3,-.4],[-.4,2]],p=[[2,1],[.2,1]],cong=x=>G.mul(G.mul(p,x),G.transpose(p));near(G.distance(a,b),G.distance(b,a));near(G.distance(a,b),G.distance(cong(a),cong(b)));});
test('Reject invalid SPD state',()=>{let caught=false;try{G.distance([[-1,0],[0,1]],G.identity(2));}catch{caught=true;}assert(caught);});
test('Derived pressures and regularization',()=>{const e=new G.Engine(rng(1));for(let i=0;i<90;i++){e.step();near(e.vitals[6],(e.vitals[4]+2*e.vitals[5])/3);near(e.vitals[7],e.vitals[4]-e.vitals[5]);assert(G.eigen(e.matrix).values.every(v=>v>=G.EPS-1e-7));near(e.d,G.distance(e.ref,e.matrix));}});
test('Repeated scenarios: calm start, real relationship shift, warning by 90s',()=>{for(let seed=1;seed<=20;seed++){const e=new G.Engine(rng(seed));let first=null;for(let i=0;i<90;i++){e.step();if(e.warning&&first===null)first=e.t;if(e.t<=15)assert(!e.warning,`early warning seed ${seed}`);}assert(first!==null,`no warning seed ${seed}`);assert(e.changes().some(c=>Math.abs(c.value)>1));results.push(`  seed ${seed}: warning ${first}s, final dR ${e.d.toFixed(3)}`);}});
test('Histories bounded / reset returns clean state',()=>{const e=new G.Engine(rng(33));for(let i=0;i<400;i++)e.step();assert(e.history.length<=180&&e.states.length<=180&&e.raw.length<=180&&e.events.length<=60&&e.window.length===36);const n=new G.Engine(rng(2));assert(n.t===0&&n.history.length===0&&!n.warning&&n.id===null);});
return {passed,failed,results};};
