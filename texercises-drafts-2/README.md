# TeXercises drafts, second bundle: dropped practice generators

Exercises built from the practice generators and worked examples that the
module overhaul cut (the first bundle, `../texercises-drafts/`, holds the
former Problems tab). 35 new exercises in 10 private collections; none has
an `"id"`, so an upload creates them. Keys continue the numbering of the
first bundle, so both bundles can be uploaded together.

| Module | Exercises | Collection | Language |
|---|---|---|---|
| em-waves | 7 | em-waves-more | ENG |
| photons | 5 | photons-more | ENG |
| matter-waves | 7 | matter-waves-more | ENG |
| electric-potential | 2 | electric-potential-more | ENG |
| electric-field | 2 | electric-field-more | ENG |
| magnetic-forces | 2 | magnetic-forces-more | ENG |
| coulomb | 1 | coulomb-more | ENG |
| torque | 6 | torque-more | GER |
| oscillations | 2 | oscillations-more | ENG |
| force-concepts | 1 | force-concepts-more | GER |

Upload: `zip -r ../learningphysics-drafts-2.zip exercises collections`, then
Settings -> Bulk import, and check the preview before confirming.

## How they were made

- Each generator drew values from lists; each exercise uses one combination
  the old generator could produce. Generators with several cases became
  sub-questions. Multiple-choice and graph-picking became open questions.
- Every result was recomputed against the old generator's formulas.
- Items close to an exercise of the first bundle were left out (lc-c, point,
  malus, malus-angle, dipole, sail, xray, compton, tunnel, closest,
  millikan).
- All files validate against the export's schemas. **No LaTeX was
  compiled.**

## Worth checking in the preview

- TikZ graphs: the X-ray spectrum (photons-11, read λ_min = 25 pm), the
  graphite rings (matter-waves-09), the y(t) graphs (oscillations-09), the
  mobile sketch (torque-14).
- Values without an SI prefix printed with `\XP{0}{2}`; the Moon distance
  `\dmP{0}{3}`; masses in GeV/c² as `\ECP{9}{3}/c^2`.
- Rankings (force-concepts-01) and the phase as a fraction of π
  (oscillations-09) are boxed as plain math, not solver quantities.
- photons-12 gives the energy share lost as Δλ/(λ+Δλ) (33 % for γ); the old
  app used Δλ/λ.
- Factor and direction exercises (electric-field-08/09, electric-potential-09,
  magnetic-forces-09) have an empty preamble.
