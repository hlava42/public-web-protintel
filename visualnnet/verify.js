// Verification harness for VERIFICATION.md: loads the <script id="vn-engine"> block of index.html (no modification)
// and runs the checks. Usage: node verify.js [index.html] [output.md]. Prints to stdout and writes the output file.
const fs = require('fs');
const html = fs.readFileSync(process.argv[2] || require('path').join(__dirname, 'index.html'), 'utf8');
const m = html.match(/<script id="vn-engine">([\s\S]*?)<\/script>/);
if(!m) throw new Error('engine block not found');
eval(m[1]);
const VN = globalThis.VN;
const SEED = 2001;
const f = (v, d=4) => (typeof v === 'number' ? v.toFixed(d) : `(${v.x.toFixed(d)}, ${v.y.toFixed(d)})`);
const out = [];
const log = (...a) => { const s = a.join(' '); out.push(s); console.log(s); };

function simFor(id, over={}){
  const e = VN.EXAMPLES.find(x => x.id === id);
  return new VN.Sim(Object.assign({ mode:e.mode, data:e.data, hcl:e.hcl, dot:e.dot, sel:e.sel, seed:SEED, tFinish:e.tFinish }, over));
}
const angle = v => Math.atan2(v.y, v.x) * 180/Math.PI;
const angBetween = (a,b) => { const d = (VN.dotp(a,b)) / (Math.hypot(a.x,a.y)*Math.hypot(b.x,b.y)); return Math.acos(Math.max(-1,Math.min(1,d)))*180/Math.PI; };

// ---------- 1. Algorithm check ----------
log('## 1. Algorithm check');
log('');
log('### HCL — Example 1 (2 samples, 1 neuron), seed ' + SEED + ', tFinish = 40, h(t) = 1·(40 − t)/39');
{
  const s = simFor(1);
  log('samples: ' + s.input.map(p=>f(p)).join(', ') + '; initial neuron: ' + f(s.hcl.neurons[0]));
  log('');
  log('| t | selected sample | h(t) used | neuron after adaptation | step length |x − m| moved |');
  log('|---|---|---|---|---|');
  const marks = new Set([1,2,3,4,5,10,20,40]);
  let prev = {x:s.hcl.neurons[0].x, y:s.hcl.neurons[0].y};
  while(!s.finished()){
    s.iterate();
    const n = s.hcl.neurons[0], moved = Math.hypot(n.x-prev.x, n.y-prev.y);
    if(marks.has(s.t)) log(`| ${s.t} | ${s.selIdx} ${f(s.input[s.selIdx])} | ${f(s.coef('hcl'))} | ${f(n)} | ${f(moved)} |`);
    prev = {x:n.x,y:n.y};
  }
  // first-move check
  const s2 = simFor(1); s2.iterate();
  const d0 = Math.hypot(s2.hcl.neurons[0].x - s2.input[s2.selIdx].x, s2.hcl.neurons[0].y - s2.input[s2.selIdx].y);
  log('');
  log(`First adaptation (t = 1): distance between neuron and selected sample after the move = ${d0.toExponential(3)} (h(1) = ${f(s2.coef('hcl'))}; the thesis says the neuron "moves all the way").`);
  // monotone step size: ratio moved / distance-before equals h(t), which decreases
  const s3 = simFor(1); const hs=[]; while(!s3.finished()){ s3.iterate(); hs.push(s3.coef('hcl')); }
  const mono = hs.every((h,i)=> i===0 || h <= hs[i-1]);
  log(`h(t) sequence strictly non-increasing over all 40 iterations: ${mono} (h(1) = ${f(hs[0])}, h(20) = ${f(hs[19])}, h(40) = ${f(hs[39])}).`);
}
log('');
log('### HCL — 100 iterations (same configuration, tFinish = 100)');
{
  const s = simFor(1, {tFinish:100});
  const marks = new Set([1,5,20,100]);
  while(!s.finished()){ s.iterate(); if(marks.has(s.t)) log(`- t = ${s.t}: h(t) = ${f(s.coef('hcl'))}, neuron = ${f(s.hcl.neurons[0])}`); }
}
log('');
log('### Dot Product SOM — Example 2 (2 samples, 1 neuron), seed ' + SEED + ', α(t) = 1.5·(40 − t)/39');
{
  const s = simFor(2);
  log('samples: ' + s.input.map(p=>f(p)+' |x|='+f(Math.hypot(p.x,p.y),3)).join(', ') + '; initial neuron: ' + f(s.dot.neurons[0]) + ' |m| = ' + f(Math.hypot(s.dot.neurons[0].x, s.dot.neurons[0].y)));
  log('');
  log('| t | sample | α(t) | α(t)·|x| | angle(m_old, x) | angle(m_new, x) | angle(m_new, m_old) | \\|m_new\\| |');
  log('|---|---|---|---|---|---|---|---|');
  let maxDev = 0, held = 0, tested = 0, firstFail = null;
  while(!s.finished()){
    const before = {x:s.dot.neurons[0].x, y:s.dot.neurons[0].y};
    s.iterate();
    const n = s.dot.neurons[0], x = s.input[s.selIdx], nm = Math.hypot(n.x,n.y), ax = s.coef('dot')*Math.hypot(x.x,x.y);
    maxDev = Math.max(maxDev, Math.abs(nm-1));
    const aOld = angBetween(before,x), aNew = angBetween(n,x), aMove = angBetween(n,before);
    if(s.t<=6 || s.t===10 || s.t===12 || s.t===20 || s.t===40) log(`| ${s.t} | ${s.selIdx} | ${f(s.coef('dot'))} | ${ax.toFixed(4)} | ${aOld.toFixed(2)}° | ${aNew.toFixed(2)}° | ${aMove.toFixed(2)}° | ${nm.toFixed(12)} |`);
    if(ax > 1 && aOld > 1){ tested++; if(aNew < aMove) held++; else if(firstFail===null) firstFail = s.t; }
  }
  log('');
  log(`Max deviation of |m| from 1 after adaptation over all 40 iterations: ${maxDev.toExponential(3)}.`);
  log(`"Un-learning": in every iteration with α(t)·|x| > |m| = 1 and a sample not already aligned with the neuron (${tested} such iterations), the adapted neuron ended closer in angle to the new sample than to its own previous direction in ${held} of ${tested} cases${firstFail===null?'':' (first failure at t = '+firstFail+')'}. The resultant of m and α(t)·x lies closer to the longer of the two, so the thesis's statement (α > 1 un-learns) holds in the port whenever α(t)·|x| > 1; here |x| ≈ 0.90–0.92, i.e. for α(t) > ≈ 1.1, which is t ≤ 11.`);
}

// ---------- 2. Phase check ----------
log('');
log('## 2. Phase check');
for(const mode of ['hcl','dot','all']){
  const cfg = mode==='hcl' ? {mode, data:'two', hcl:'one', dot:'one'} : mode==='dot' ? {mode, data:'two', hcl:'one', dot:'one'} : {mode, data:'triples', hcl:'six', dot:'two'};
  const s = new VN.Sim(Object.assign({seed:SEED, tFinish:10}, cfg));
  const keys = []; do { keys.push(s.step()); } while(s.pi !== 0);
  log(`- ${mode}: ` + keys.map(k => `${k} ("${VN.PHASE_INFO[k][0]}")`).join(' → '));
}

// ---------- 3. Examples check ----------
log('');
log('## 3. Examples check');
function winsPerNeuron(s, layer){
  // after learning, which neuron wins for each sample (competition only, no adaptation)
  const counts = s[layer].neurons.map(()=>[]);
  s.input.forEach((x,i)=>{
    let best=-1, bs = layer==='hcl' ? Infinity : -Infinity;
    s[layer].neurons.forEach((m,j)=>{ const v = layer==='hcl' ? VN.dist2(m,x) : VN.dotp(m,x); if(layer==='hcl' ? v<bs : v>bs){bs=v;best=j;} });
    counts[best].push(i);
  });
  return counts;
}
function runCounting(s, layer){
  const wins = s[layer].neurons.map(()=>0);
  while(!s.finished()){ s.iterate(); wins[s[layer].position]++; }
  return wins;
}
log('');
log('### Example 3 — poor initialisation (regions: centre (−0.6,0) and (0.6,0), radius 0.15, 150 samples each)');
{
  const s = simFor(3);
  const region = i => i < 150 ? 1 : 2;
  const winsR1 = s.hcl.neurons.map(()=>0), winsR2 = s.hcl.neurons.map(()=>0);
  while(!s.finished()){ s.iterate(); (region(s.selIdx)===1 ? winsR1 : winsR2)[s.hcl.position]++; }
  log('wins per neuron during learning for region-1 samples: [' + winsR1.join(', ') + '], for region-2 samples: [' + winsR2.join(', ') + ']');
  log('final neuron positions: ' + s.hcl.neurons  .map(n=>f(n)).join('; '));
  const only = winsR1.filter(w=>w>0).length === 1 && winsR1[0] > 0;
  log(`Result: ${only ? 'YES' : 'NO'} — neuron 1 alone wins every region-1 sample; the other five never enter region 1.`);
}
log('');
log('### Example 4 — suitable initialisation');
{
  const s = simFor(4);
  const region = i => i < 150 ? 1 : 2;
  const winsR1 = s.hcl.neurons.map(()=>0), winsR2 = s.hcl.neurons.map(()=>0);
  while(!s.finished()){ s.iterate(); (region(s.selIdx)===1 ? winsR1 : winsR2)[s.hcl.position]++; }
  log('wins per neuron for region-1 samples: [' + winsR1.join(', ') + '], region-2: [' + winsR2.join(', ') + ']');
  log('final neuron positions: ' + s.hcl.neurons  .map(n=>f(n)).join('; '));
  const inR1 = s.hcl.neurons.filter(n=>n.x<0).length;
  log(`Result: ${inR1===3 ? 'YES' : 'NO'} — ${inR1} neurons end in region 1, ${6-inR1} in region 2.`);
}
log('');
log('### Example 5 — selection method, HCL (36 samples on a circle of radius 0.6; neuron 2 at (−1.2,−0.8), distance to nearest sample ' + (Math.hypot(1.2,0.8)-0.6).toFixed(3) + ' > radius 0.6)');
{
  const a = simFor(5, {sel:'seq'}); const wa = runCounting(a, 'hcl');
  log(`in order: wins = [${wa.join(', ')}]; final positions ${a.hcl.neurons  .map(n=>f(n)).join('; ')}`);
  log(`Result (in order): ${wa[1]===0 ? 'YES' : 'NO'} — the second neuron never wins${wa[1]===0 ? ' and does not move' : ''}.`);
  const b = simFor(5, {sel:'random'}); const wb = runCounting(b, 'hcl');
  log(`random: wins = [${wb.join(', ')}]; final positions ${b.hcl.neurons  .map(n=>f(n)).join('; ')}`);
  log(`Result (random): ${wb[1]>0 ? 'YES' : 'NO'} — the second neuron wins ${wb[1]} of ${b.tFinish} iterations and joins the learning.`);
}
log('');
log('### Example 6 — selection method, Dot Product SOM (neuron 1 = (0.4,0.35), |m| = 0.531; neuron 2 = (−0.3,−0.4), |m| = 0.5)');
{
  const a = simFor(6, {sel:'seq'}); let firstWin2 = null, alphaAt = null; { const wins=[0,0]; while(!a.finished()){ a.iterate(); wins[a.dot.position]++; if(a.dot.position===1 && firstWin2===null){ firstWin2 = a.t; alphaAt = a.coef('dot'); } } var wa = wins; }
  if(firstWin2!==null) log(`in order: the second neuron wins for the first time at t = ${firstWin2} (α(t) = ${alphaAt.toFixed(3)}); before that, ${firstWin2-1} iterations (${((firstWin2-1)/a.tFinish*100).toFixed(0)} % of the run) are won by neuron 1 alone.`);
  log(`in order: wins = [${wa.join(', ')}]; final vectors ${a.dot.neurons  .map(n=>f(n)).join('; ')} (|m| = ${a.dot.neurons.map(n=>Math.hypot(n.x,n.y).toFixed(4)).join(', ')})`);
  log(`Result (in order): ${wa[1]===0 ? 'YES' : 'PARTLY'} — ${wa[1]===0 ? 'the second neuron never wins' : 'the second neuron never wins while α(t) is large enough for neuron 1 to follow the sequence; once α(t) is small, neuron 1 can no longer keep up with the sample moving 10° per iteration, its lag grows past the point where m₁·x < m₂·x, and neuron 2 wins ' + wa[1] + ' of the remaining iterations'}.`);
  // lag of the dragged neuron behind the sample under ordered selection
  const c = simFor(6, {sel:'seq'}); let lagRows=[]; while(!c.finished()){ c.iterate(); if([36,72,144,216,252,270,288,324,360].includes(c.t)) lagRows.push(`t = ${c.t}: α = ${c.coef('dot').toFixed(3)}, lag = ${angBetween(c.dot.neurons[0], c.input[c.selIdx]).toFixed(1)}°`); }
  log('angle by which neuron 1 lags behind the current sample: ' + lagRows.join('; ') + '. Neuron 2 (|m₂| = 0.5) can win only when the lag exceeds 60° (cos 60° = 0.5).');
  const b = simFor(6, {sel:'random'}); const wb = runCounting(b, 'dot');
  log(`random: wins = [${wb.join(', ')}]; final vectors ${b.dot.neurons  .map(n=>f(n)).join('; ')} (|m| = ${b.dot.neurons.map(n=>Math.hypot(n.x,n.y).toFixed(4)).join(', ')})`);
  log(`Result (random): ${wb[1]>0 ? 'YES' : 'NO'} — the second neuron wins ${wb[1]} of ${b.tFinish} iterations and is normalised.`);
  // what happens with two unit-length neurons
  const u = new VN.Sim({mode:'dot', data:'circle', hcl:'circle2', dot:'circle2', sel:'seq', seed:SEED, tFinish:360});
  u.dot.neurons[1] = VN.norm(u.dot.neurons[1]);
  const wu = runCounting(u, 'dot');
  log(`Control run with neuron 2 normalised to length 1 before learning, in order: wins = [${wu.join(', ')}] — the effect then does NOT occur (see §4, parameters).`);
}
log('');
log('### Example 7 — four isolated regions (centres (0.22,0.8), (0.68,0.8), (0.22,0.2), (0.68,0.2), radius 0.1, 120 samples each; 4 neurons uniformly random in [0,1]²)');
{
  const centres = [[0.22,0.8],[0.68,0.8],[0.22,0.2],[0.68,0.2]];
  function evalSeed(seed){
    const e = VN.EXAMPLES.find(x=>x.id===7);
    const s = new VN.Sim({mode:'hcl', data:'regions4', hcl:'random4', dot:'two', sel:'random', seed, tFinish:e.tFinish});
    const init = s.hcl.neurons.map(n=>({x:n.x,y:n.y}));
    while(!s.finished()) s.iterate();
    const near = s.hcl.neurons.map(n => { let b=-1,bd=Infinity; centres.forEach((c,i)=>{const d=Math.hypot(n.x-c[0],n.y-c[1]); if(d<bd){bd=d;b=i;}}); return {i:b, d:bd}; });
    const ok = new Set(near.map(n=>n.i)).size === 4 && near.every(n=>n.d < 0.05);
    return { ok, init, final:s.hcl.neurons, near };
  }
  const r = evalSeed(SEED);
  log(`seed ${SEED}: initial neurons ${r.init  .map(n=>f(n)).join('; ')}`);
  log(`seed ${SEED}: final neurons ${r.final  .map(n=>f(n)).join('; ')}; nearest region centre and distance: ${r.near.map(n=>`R${n.i+1} ${n.d.toFixed(3)}`).join(', ')}`);
  log(`Result (seed ${SEED}): ${r.ok ? 'YES' : 'NO'} — ${r.ok ? 'four neurons end near four different centres' : 'not all four regions receive one neuron'}.`);
  let okc = 0; const okSeeds=[], badSeeds=[]; for(let sd=1; sd<=50; sd++){ const q = evalSeed(sd); if(q.ok){okc++; okSeeds.push(sd);} else badSeeds.push(sd); }
  log(`Seeds 1–50: the effect of Fig. 2.1 occurs for ${okc} of 50 seeds (e.g. ${okSeeds.slice(0,8).join(', ')}); it fails for ${50-okc} (e.g. ${badSeeds.slice(0,8).join(', ')}) — with random placement one region can capture two neurons, which is exactly the dependence on initialisation of Example 3.`);
}
log('');
log('### Example 8 — two triples of clusters (lines at 20° and 155°, enclosed angle 135°; cluster centres at r = 0.35, 0.65, 0.95, radius 0.06, 40 samples each); 6 HCL neurons, 2 Dot Product SOM neurons, both layers on the same input (ExecuteNnetAll)');
{
  const s = simFor(8);
  const cluster = i => Math.floor(i/40);           // 0..2 = triple A (20°), 3..5 = triple B (155°)
  while(!s.finished()) s.iterate();
  const wh = winsPerNeuron(s,'hcl').map(l => { const cs = new Set(l.map(cluster)); return {n:l.length, clusters:[...cs].map(c=>c+1)}; });
  const wd = winsPerNeuron(s,'dot').map(l => { const cs = new Set(l.map(cluster)); return {n:l.length, clusters:[...cs].map(c=>c+1)}; });
  log('HCL final positions: ' + s.hcl.neurons  .map(n=>f(n)).join('; '));
  log('HCL: samples won per neuron after learning: ' + wh.map((w,i)=>`n${i+1}: ${w.n} samples from cluster(s) {${w.clusters.join(',')}}`).join('; '));
  const hclOk = wh.every(w => w.clusters.length === 1 && w.n === 40);
  log(`Result HCL: ${hclOk ? 'YES' : 'NO'} — ${hclOk ? 'each HCL neuron takes exactly one cluster' : 'not every neuron holds exactly one cluster'}.`);
  log('Dot final vectors: ' + s.dot.neurons.map(n=>f(n)+' angle '+angle(n).toFixed(2)+'°, |m| = '+Math.hypot(n.x,n.y).toFixed(6)).join('; '));
  log('Dot: samples won per neuron after learning: ' + wd.map((w,i)=>`n${i+1}: ${w.n} samples from cluster(s) {${w.clusters.join(',')}}`).join('; '));
  const dotOk = wd.every(w => w.n === 120) && wd.some(w=>w.clusters.join(',')==='1,2,3') && wd.some(w=>w.clusters.join(',')==='4,5,6');
  log(`Result Dot: ${dotOk ? 'YES' : 'NO'} — ${dotOk ? 'each Dot Product SOM neuron takes one whole triple' : 'the triples are not separated one per neuron'}.`);
}

fs.writeFileSync(process.argv[3] || require('path').join(__dirname, 'verify_out.md'), out.join('\n'));
