# VisualNnet port — verification notes

These notes record what was checked in the 2026 HTML5 Canvas port against the 2001 thesis
(unofficial English translation, `thesis/Hummel_2001_thesis_EN_translation.pdf`), what had to be
chosen because the thesis does not give it, and what the port does not contain.

All numbers below come from actual runs of the engine, not from reading the code. The engine is
the `<script id="vn-engine">` block of `index.html`; it has no DOM dependency, and the harness
`verify.js` (Node.js, `node verify.js`) loads that exact block and runs the checks. The same runs
can be reproduced in the browser with the seed field set to **2001** (the default), the example
selected, fast mode on, and Start. Section and equation numbers refer to the thesis.

## 1. Algorithm check

### 1.1 Hard Competitive Learning — Example 1 (2 samples, 1 neuron), seed 2001

Configuration: samples (0.9000, 0.2000) and (0.3000, 0.8500); initial neuron (−0.5000, −0.4000);
timeOfFinish = 40; h(t) = 1.0 · (40 − t)/39 (see §4 for the choice of schedule). Adaptation is
relation (2.5): w(t+1) = w(t) + h(t)·[x(t) − w(t)].

| t | selected sample | h(t) | neuron after adaptation | distance moved |
|---|---|---|---|---|
| 1 | 0 (0.9000, 0.2000) | 1.0000 | (0.9000, 0.2000) | 1.5232 |
| 2 | 0 (0.9000, 0.2000) | 0.9744 | (0.9000, 0.2000) | 0.0000 |
| 3 | 0 (0.9000, 0.2000) | 0.9487 | (0.9000, 0.2000) | 0.0000 |
| 4 | 1 (0.3000, 0.8500) | 0.9231 | (0.3462, 0.8000) | 0.8165 |
| 5 | 0 (0.9000, 0.2000) | 0.8974 | (0.8432, 0.2615) | 0.7328 |
| 10 | 0 (0.9000, 0.2000) | 0.7692 | (0.9000, 0.2000) | 0.0000 |
| 20 | 1 (0.3000, 0.8500) | 0.5128 | (0.5546, 0.5741) | 0.3952 |
| 40 | 1 (0.3000, 0.8500) | 0.0000 | (0.5236, 0.6077) | 0.0000 |

- First adaptation (t = 1): distance between the neuron and the selected sample after the move
  = 1.2·10⁻¹⁶, i.e. the neuron "moves all the way to the position of the selected input sample"
  as §5.1, Example 1 describes. (A first version of the port used h(t) = 1 − t/T, which gave
  h(1) = 0.975 and a residual distance of 0.033; the schedule was changed so that h(1) = 1 exactly.)
- h(t) is non-increasing over all 40 iterations: h(1) = 1.0000, h(20) = 0.5128, h(40) = 0.0000.
  The distance moved in one iteration equals h(t)·|x − w|, so the step toward a given sample
  shrinks with t, as Example 1 describes ("the change in the neuron's position keeps decreasing").

Same configuration with timeOfFinish = 100 (the brief asked for 1, 5, 20, 100 iterations):

| t | h(t) | neuron |
|---|---|---|
| 1 | 1.0000 | (0.9000, 0.2000) |
| 5 | 0.9596 | (0.8765, 0.2255) |
| 20 | 0.8081 | (0.4121, 0.7285) |
| 100 | 0.0000 | (0.7180, 0.3972) |

### 1.2 Dot Product SOM — Example 2 (2 samples, 1 neuron), seed 2001

Configuration: the same two samples, |x| = 0.922 and 0.901; initial neuron (−0.3000, −0.5000),
|m| = 0.583 (deliberately not normalised, §2.1.6: a not-yet-used neuron is normalised by its
first adaptation); timeOfFinish = 40; α(t) = 1.5 · (40 − t)/39. Competition is relation (2.9)
(arg max x·m), adaptation is relation (2.21): m(t+1) = (m + α(t)·x) / ‖m + α(t)·x‖.

| t | sample | α(t) | α(t)·\|x\| | angle(m_old, x) | angle(m_new, x) | angle(m_new, m_old) | \|m_new\| |
|---|---|---|---|---|---|---|---|
| 1 | 0 | 1.5000 | 1.3829 | 133.49° | 23.31° | 110.18° | 1.000000000000 |
| 2 | 0 | 1.4615 | 1.3475 | 23.31° | 9.91° | 13.41° | 1.000000000000 |
| 3 | 0 | 1.4231 | 1.3120 | 9.91° | 4.28° | 5.62° | 1.000000000000 |
| 4 | 1 | 1.3846 | 1.2481 | 62.31° | 27.34° | 34.97° | 1.000000000000 |
| 5 | 0 | 1.3462 | 1.2411 | 30.69° | 13.65° | 17.04° | 1.000000000000 |
| 6 | 0 | 1.3077 | 1.2056 | 13.65° | 6.19° | 7.47° | 1.000000000000 |
| 10 | 0 | 1.1538 | 1.0638 | 0.64° | 0.31° | 0.33° | 1.000000000000 |
| 12 | 0 | 1.0769 | 0.9929 | 0.15° | 0.08° | 0.08° | 1.000000000000 |
| 20 | 1 | 0.7692 | 0.6934 | 47.57° | 28.35° | 19.22° | 1.000000000000 |
| 40 | 1 | 0.0000 | 0.0000 | 21.52° | 21.52° | 0.00° | 1.000000000000 |

- Normalisation: maximum deviation of |m| from 1 after adaptation, over all 40 iterations,
  is 2.2·10⁻¹⁶ (double-precision rounding). The initial vector of length 0.583 becomes a unit
  vector at t = 1 and stays one.
- "Un-learning" while α > 1 (§2.1.6: "If α(t) > 1, the learned neuron is 'un-learned', and
  thereby gives another neuron the chance to win"): in every iteration in which α(t)·|x| > |m| = 1
  and the sample was not already aligned with the neuron (9 such iterations), the adapted neuron
  ended closer in angle to the new sample than to its own previous direction — 9 of 9 cases
  (e.g. t = 1: 23.31° to the new sample vs. 110.18° from the old direction). The resultant of
  m and α(t)·x lies closer to the longer of the two vectors, so the thesis's statement holds in the
  port exactly when α(t)·|x| > |m|. The thesis states the condition as α > 1; with the input
  samples of this port not normalised (|x| ≈ 0.90–0.92) that is α(t) > ≈ 1.1, i.e. t ≤ 11 here.
  For unit-length inputs the two conditions coincide.

## 2. Phase check

Phases displayed by the information panel for one full iteration, as executed by the engine
(`selectPartOfIteration` equivalent), compared with §3.1 of the build brief and §4.1.3 of the thesis:

**HCL:** Initial state → Selection of the input sample → Selection of the winning neuron (HCL) →
Adaptation of the winning neuron (HCL, movement animated). — Matches the four states listed in
§4.1.3. No deviation.

**Dot Product SOM:** Initial state → Selection of the input sample → Selection of the winning
neuron (Dot Product SOM) → Adaptation 1/6 drawing the neuron vector m → 2/6 adding the input
vector x to m → 3/6 shortening x by the coefficient α(t) → 4/6 drawing the new vector m + α(t)·x
→ 5/6 normalising the new vector → 6/6 moving the neuron (movement animated). — Matches the six
partial parts of the adaptation listed in §4.1.3. No deviation.

**Both at once (ExecuteNnetAll, Example 8):** Initial state → Selection of the input sample →
HCL winner → HCL adaptation → Dot Product SOM winner → the six Dot Product SOM adaptation parts.
The thesis says `ExecuteNnetAll` simulates both networks on the same input at once but does not
specify the order of the two networks' phases within an iteration; the port runs the HCL phases
first, then the Dot Product SOM phases, on the same selected sample. Both layers are drawn on
one animation panel, as the thesis describes for `paintComponent` traversing `allLayers`.

Each phase shows one sentence on what is happening and why (§4.1.2, "an apt description of the
essence of the current processes"). The Step button executes one atomic phase.

In fast mode only the final state of every 50th iteration is drawn (thesis §4.1.3: "a parameter
whose value determines after how many iterations the current state is to be displayed").

## 3. Examples check (seed 2001, fast mode, run to timeOfFinish)

| # | Example | Effect described in the thesis | Result |
|---|---|---|---|
| 1 | Introduction to HCL | first move lands on the sample, later moves shrink | **Yes** — see §1.1. |
| 2 | Introduction to Dot Product SOM | vector composition, normalisation, un-learning at α > 1 | **Yes** — see §1.2. |
| 3 | Poor initialisation in HCL | one neuron captures region 1, the others never enter it | **Yes** — wins for region-1 samples during learning: [320, 0, 0, 0, 0, 0]; for region-2 samples: [0, 40, 71, 63, 54, 52]. Final positions (−0.6064, 0.0101); (0.6692, 0.0539); (0.5855, 0.0958); (0.5200, −0.0090); (0.5898, −0.0782); (0.7014, −0.0440). |
| 4 | Suitable initialisation in HCL | neurons spread over both regions | **Yes** — wins for region-1 samples: [145, 94, 81, 0, 0, 0]; region-2: [0, 0, 0, 93, 101, 86]; three neurons end in each region: (−0.6582, −0.0027); (−0.5366, 0.0603); (−0.5232, −0.0606); (0.5538, −0.0514); (0.5993, 0.0871); (0.6832, −0.0338). |
| 5 | Selection method in HCL | in order: the second neuron never wins; random: it joins | **Yes** — in order: wins [360, 0], neuron 2 stays at (−1.2000, −0.8000), neuron 1 ends at (−0.0864, 0.0066); random: wins [181, 179], final (0.0339, 0.4443) and (−0.1575, −0.3909). |
| 6 | Selection method in Dot Product SOM | in order: the second neuron never wins; random: it joins | **Partly** — in order: neuron 1 alone wins the first 276 iterations (77 % of the run); from t = 277 (α = 0.347) neuron 2 wins 47 of the remaining 84, final wins [313, 47]. Random: wins [174, 186], both neurons normalised. See the note below. |
| 7 | Four isolated regions (Fig. 2.1) | four neurons end near four centres | **Yes** for seed 2001 — final (0.6729, 0.1972); (0.6832, 0.7968); (0.2373, 0.8045); (0.2310, 0.1896), each within 0.02 of a different region centre. Over seeds 1–50 the effect occurs for 49 seeds and fails for seed 8 (one region captures two neurons — the dependence on initialisation of Example 3). |
| 8 | Different conception of clusters | HCL: one cluster per neuron; Dot: one whole triple per neuron | **Yes** — HCL: after learning each of the six neurons wins exactly the 40 samples of one cluster; final positions (0.3232, 0.1065); (0.5993, 0.2160); (0.8890, 0.3251); (−0.3116, 0.1548); (−0.5953, 0.2553); (−0.8500, 0.4051). Dot: neuron 1 at angle 19.78° wins all 120 samples of the triple on the 20° line, neuron 2 at 154.87° wins all 120 samples of the triple on the 155° line; both |m| = 1.000000. |

**Note on Example 6.** Under ordered selection the sample moves 10° per iteration around the
circle. The dragged neuron follows it with a lag that grows as α(t) decreases: lag 12.3° at
t = 36 (α = 1.354), 18.5° at t = 144 (α = 0.903), 28.1° at t = 216 (α = 0.602), 46.6° at t = 270
(α = 0.376), then 170.3° at t = 288 (α = 0.301). The second neuron has length 0.5, so it can win
only when the first neuron's lag exceeds 60° (cos 60° = 0.5); that happens once α(t) falls below
≈ 0.35. The thesis does not say for how many iterations the effect is expected to last. With
the port's linear schedule to zero it lasts 77 % of the run; the check is reported as it came out.
A control run with the second neuron normalised to length 1 *before* learning (in order) gave
wins [182, 178] — with two unit-length neurons the effect does not occur at all, because the
sequence passes through the second neuron's direction and the lagging first neuron loses there.
The unnormalised second neuron is the reading of §2.1.6 that makes the thesis's description
observable; see §4.

## 4. Parameters chosen

The thesis gives no numbers for the example geometries, the learning-coefficient schedules or the
run lengths. Every value below is a choice of the port.

**Learning coefficient.** Linear decrease from the initial value at the first iteration to zero
at the last: c(t) = c₀ · (T − t)/(T − 1), where T = timeOfFinish and t = timeActual (incremented
on each selection of an input sample, as §4.3.5 describes). HCL: h₀ = 1.0, so that the first
adaptation moves the neuron all the way to the sample (Example 1). Dot Product SOM: α₀ = 1.5, so
that α starts above 1 (§2.1.6) and the un-learning of §1.2 is visible. The thesis says only
that the coefficient is "derived from" timeActual and decreases toward zero.

**Run lengths (timeOfFinish).** Examples 1–2: 40; 3–4: 600; 5–6: 360 (ten passes around the
36-sample circle); 7: 800; 8: 900. Custom configurations built by hand: at least 200.

**Input data (`setOfInputData`).** Five sets, only those the eight examples need:

- Two input samples: (0.90, 0.20) and (0.30, 0.85), |x| ≈ 0.92 and 0.90 (close to 1 so that
  α > 1 un-learns for a visible number of iterations).
- Two isolated regions: discs of radius 0.15 centred at (−0.6, 0) and (0.6, 0), 150 samples each,
  constant density (`fetchFullCircle`); region diameter 0.3.
- Circle centred at [0,0]: 36 samples on the circumference of radius 0.6, in angular order.
- Four isolated regions: discs of radius 0.10 centred at (0.22, 0.8), (0.68, 0.8), (0.22, 0.2),
  (0.68, 0.2), 120 samples each — read off Fig. 2.1.
- Two triples of clusters: lines through the origin at 20° and 155° (enclosed angle 135°, the
  thesis requires ≥ 130°); cluster centres at radii 0.35, 0.65, 0.95 on each line; discs of
  radius 0.06, 40 samples each.

**HCL neuron layouts (`setOfHCLData`).**

- Example 1: (−0.5, −0.4).
- Example 3 (poor): neuron 1 at (−0.3, 0.2), distance to the nearest point of region 1 = 0.21;
  the other five around region 2 at (0.77, 0), (0.65, 0.16), (0.46, 0.10), (0.46, −0.10),
  (0.65, −0.16), each ≥ 0.9 from the nearest point of region 1, i.e. farther than the region's
  diameter 0.3 — the condition stated in Example 3.
- Example 4 (suitable): (−0.5, 0.25), (−0.72, −0.15), (−0.45, −0.22), (0.5, 0.25),
  (0.72, −0.15), (0.45, −0.22).
- Examples 5–6: neuron 1 at (0.5, 0.5); neuron 2 at (−1.2, −0.8), 0.842 from the nearest sample,
  which is more than the radius 0.6 (Example 5's condition) and less than the diameter 1.2 (so
  that random selection lets it win).
- Example 7: four neurons uniformly random in [0,1]², drawn from the seeded generator.
- Example 8: six neurons at radii 0.35, 0.65, 0.95 on the lines at 35° and 140°, i.e. 15° off the
  cluster lines, so that each neuron's nearest cluster is a different one (a suitable
  initialisation in the sense of Example 4; with random placement the outcome of Example 3 could
  occur instead).

**Dot Product SOM neuron layouts (`setOfDotData`).** Initial vectors are not normalised, per
§2.1.6 ("as soon as a not-yet-used neuron is adapted, it is automatically normalized from that
time on"); the port normalises a neuron only through relation (2.21).

- Example 2: (−0.3, −0.5), |m| = 0.583.
- Example 6: neuron 1 (0.4, 0.35), |m| = 0.531; neuron 2 (−0.3, −0.4), |m| = 0.5. The length of
  neuron 2 is what keeps it from winning under ordered selection (§3, note on Example 6).
- Example 8 and the default for other data: (0.5, −0.3) and (−0.2, 0.6).

**Other.** Fast mode redraws every 50 iterations. Slow-mode delay per phase: 60 ms + 14 ms per
speed-slider percent below 100. Random numbers: mulberry32 seeded from the Seed field; one
generator per simulation feeds data generation, random layouts and random sample selection.

## 5. Known gaps

What the thesis says about the 2001 applet that the port does not contain, or cannot show is the
same:

1. **The original Java source was not an input of the port.** The port was written against the
   thesis's description of the classes (§4.3: `Parameters`, `Layer*`, `Nnet*`, `ExecuteNnet*`,
   `MainGraphicsPanel`, `RunNnet`) and the algorithms (2.4), (2.5), (2.9), (2.21). Whether the
   port's numerical behaviour equals the original applet's cannot be verified without that
   source; the source-code excerpt of `ExecuteNnetHCL` is in an appendix of the original that the
   translation does not reproduce.
2. **Original parameters unknown.** The learning-coefficient schedule, initial coefficients,
   timeOfFinish values, animation delays, region sizes, sample counts and neuron layouts of the
   applet's examples are not in the thesis; all are choices listed in §4.
3. **Predefined data sets.** The applet had 7 predefined input-sample layouts, 5 HCL neuron
   layouts and 5 Dot Product SOM neuron layouts (§4.3.5). The port has 5, 6 and 3 respectively —
   only those needed for the eight examples; which sets the original contained beyond that is not
   stated.
4. **Example 6** shows the described effect for 77 % of the run, not the whole run (§3).
5. **WWW presentation** (§4.5: introductory information, theoretical part, reference manual,
   user guide, optional quiz) and the **user documentation** (§4.6) are not reproduced.
6. **Testing** (§4.4, Ing. Jan Ingerle) applied to the 2001 applet; the port has not been tested
   by a second person.
7. **Kohonen self-organizing map, neural gas, Sammon projection** are analysed in the thesis
   (§2.1.4, §2.1.5, §3.2.1) but were not implemented in the applet (`modeOfExecution` has three
   values: HCL, Dot Product SOM, both — §4.3.5) and are not in the port.
8. **Layout.** Fig. 4.5 places the information panel above and the control panel below the
   animation; the port keeps the information panel above the canvas and puts the controls in a
   side column. Colours (`activeColor` / `passiveColor` of the layers) are the port's own.
9. **Additions not in the thesis:** the Step button (one atomic phase per click), the Seed field,
   and the example description shown under the canvas. Restart is done with a generation counter
   instead of `parameter.stop` and a thread interrupt.
10. **Fast-mode display interval** is fixed at 50 iterations, not a user-settable parameter.
11. **Phase order in the combined simulation** (`ExecuteNnetAll`) is the port's choice (§2).

## 6. Seed

The Seed field (default **2001**) seeds every random choice of a simulation. Restart with the same
seed, example and selection mode reproduces the same run, and the numbers in this file. The
Node harness `verify.js` uses the same seed and the same engine block.
