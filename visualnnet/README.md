# VisualNnet

## What this is

In 2001 Petr Hummel defended a master's thesis at the Czech Technical University in Prague,
Faculty of Electrical Engineering, analysing the learning of two self-organizing neural networks
— Hard Competitive Learning (the Kohonen self-organizing network) and the Dot Product SOM — and
designing a Java applet, VisualNnet, that animates their learning. The applet divided every
iteration into atomic phases (selection of the sample, competition, adaptation broken into vector
steps), displayed each phase with a description of what is happening and why, ran the two
networks separately or both at once on the same input, and came with eight example cases. This
folder is a port of the applet's core to HTML5 Canvas, made in 2026 with an AI coding assistant;
the algorithm logic follows the original classes as the thesis describes them, and examples 1–8
are rebuilt from §5.1 of the thesis.

## What the thesis showed

- Two paradigms of self-organizing learning, analysed side by side: Hard Competitive Learning,
  in which the neuron nearest to the sample (Euclidean distance, relations 2.4–2.5) wins and moves
  toward it, and the Dot Product SOM, in which the neuron with the largest dot product wins
  (2.8–2.9) and is adapted by vector addition and normalisation (2.21).
- The author's own proofs for the Dot Product SOM, which the literature gave without explanation:
  the set of vectors with a constant dot product with x is a line perpendicular to x (2.10–2.12);
  after normalisation of the neuron vectors the dot product measures directional similarity, and
  it is maximal if and only if the neuron vector is parallel to the sample (2.13–2.20).
- Hard Competitive Learning depends on the initialisation of the neurons — a neuron that
  reaches an isolated region first can keep it for itself (§2.1.3, Example 3) — and on the order
  in which samples are selected (Example 5); random selection suppresses the second effect.
- For visualising learning the iteration must be divided into atomic phases, each shown with its
  cause, because tools that show only the result of an iteration (batch programs, Matlab, the
  DemoGNG applet's teach mode) hide why the change happened (§3, §4.1).
- The Sammon projection cannot preserve all distance ratios when projecting to lower dimensions;
  points most distant in the input space can land side by side — shown on the 4-dimensional cube
  (vertices 1001 and 0110) and the 6-dimensional cube (110000 and 001111), §3.2.1.

## Run it

Open `index.html` in a browser (it works from a local file: no network, no build step), or go to
`https://protintel.com/visualnnet/`. Choose an example, then Start, or Step to execute one phase
at a time. Fast mode shows only the final state of the iterations.

## The examples

| # | Example (thesis §5.1) | Algorithm | Selection | What it shows |
|---|---|---|---|---|
| 1 | Introduction to Hard Competitive Learning | HCL | random | Two samples, one neuron: the first move lands on the sample, later moves shrink with h(t). |
| 2 | Introduction to Dot Product SOM | Dot | random | The same with a Dot Product SOM neuron; adaptation drawn as the composition of vectors of (2.21). |
| 3 | The influence of poor initialization on learning in HCL | HCL | random | Two isolated regions, six neurons; one neuron takes a whole region and the others never enter it. |
| 4 | Suitable initialization in HCL learning | HCL | random | The same regions with neurons placed near both; three neurons per region. |
| 5 | The influence of the input-sample selection method on HCL learning | HCL | in order / random | Samples on a circle; in order the second neuron never wins, with random selection it joins. |
| 6 | The influence of the input-sample selection method on Dot Product SOM learning | Dot | in order / random | The same dependence for the Dot Product SOM (see the verification notes for how long the effect lasts). |
| 7 | Four isolated regions | HCL | random | Reproduces Fig. 2.1: four random neurons settle in four regions (depending on the seed). |
| 8 | Different conception of clusters after learning in HCL and Dot Product SOM | both at once | random | Two triples of clusters on lines through the origin: HCL takes one cluster per neuron, the Dot Product SOM one triple per neuron. |

## Fidelity and known gaps

[VERIFICATION.md](VERIFICATION.md) records the checks made on actual runs (neuron positions per
iteration, normalisation, the phases displayed, the effect of each example), every parameter that
had to be chosen because the thesis does not give it, and the list of known gaps. In short, the
port does not contain: the original Java source (it was not among the inputs; the port follows the
thesis's description of the classes), the applet's original parameters and its full set of
predefined data layouts, the WWW presentation and user documentation (§4.5–4.6), the quiz, and the
2001 testing. Example 6 shows its effect for 77 % of the run, not all of it. Kohonen maps, neural
gas and the Sammon projection are analysed in the thesis but were not implemented in the applet
and are not implemented here. The Step button and the Seed field are additions of the port.

## The translation

`thesis/Hummel_2001_thesis_EN_unofficial.pdf` is an unofficial English translation of the Czech
original, produced in 2026 from OCR of the original PDF, whose Type 3 fonts carried no text layer.
The prose was recovered with high fidelity; the equations were reconstructed by hand from the
rendered pages, and (2.18)–(2.19), illegible in the first scan, were recovered from the original
2001 PostScript file. The original title page was not recoverable, so the title on the cover is a
reconstruction from the chapter headings. The original carries a sign slip in (2.14)/(2.16) — a
"+" where differentiating (2.13) gives "−"; the translation notes it, the corrected sign reappears
from (2.17) onward, and the conclusion (a maximum) is unaffected. The figures are not reproduced
in the translation; they remain in the original PDF. See `thesis/TRANSLATION_NOTE.md`.

## Credits

Author, 2001: Petr Hummel. Tester, 2001: Ing. Jan Ingerle (as named in the thesis).
Port, 2026: Petr Hummel with an AI coding assistant.

## Licence

The port, the examples and these notes: MIT, see [LICENSE](LICENSE). The thesis PDF and its
translation note: © Petr Hummel 2001; unofficial translation 2026, all rights reserved.
