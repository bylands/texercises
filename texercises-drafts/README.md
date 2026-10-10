# TeXercises drafts of the former Problems mode

The story problems that used to live in the modules' Problems mode, rewritten
as TeXercises exercises in the bulk-import format (see the README of a
TeXercises export for the format). 121 new exercises in 15 private
collections, one per module; none has an `"id"`, so an upload creates them.

| Module | Exercises | Collection | Language |
|---|---|---|---|
| force-systems | 12 | force-systems-problems | GER |
| energy-conservation | 10 | energy-conservation-problems | GER |
| torque | 10 | torque-problems | GER |
| oscillations | 8 | oscillations-problems | ENG |
| circuit-trainer | 10 | circuit-trainer-problems | ENG |
| coulomb | 9 | coulomb-problems | ENG |
| impedance | 9 | impedance-problems | ENG |
| electric-potential | 8 | electric-potential-problems | ENG |
| electric-field | 7 | electric-field-problems | ENG |
| magnetic-forces | 7 | magnetic-forces-problems | ENG |
| em-waves | 7 | em-waves-problems | ENG |
| photons | 7 | photons-problems | ENG |
| matter-waves | 6 | matter-waves-problems | ENG |
| wave-propagation | 6 | wave-propagation-problems | ENG |
| induction-match | 5 | induction-match-problems | ENG |

The language follows the existing collections on each topic.

## Upload

    cd texercises-drafts && zip -r ../learningphysics-drafts.zip exercises collections

Then Settings -> Bulk import on TeXercises, and check the preview before
confirming. A single module can be uploaded by zipping its collection file
and its `exercises/<module>-*` folders.

## How they were made

- The old problems drew random values from lists; each exercise uses one
  fixed set of those values (mechanics: the app's own instance for seed 1).
- Every number is computed by the solver (`\NewQty`, `\SolQty`); the results
  were recomputed against the old apps' formulas and agree.
- Multiple-choice and "pick the graph" questions became open questions or
  sketches; the old explanations became the solutions.
- g = 10 m/s² in the German mechanics exercises, `\ncg` in oscillations;
  coulomb keeps the app's rounded constants (k = 9.0·10⁹, e = 1.6·10⁻¹⁹).
- Figures in TikZ/circuitikz where values must be read off (impedance
  curves, seismogram, circuits, mass spectrometer, cable echo, slinky);
  decorative pictures were dropped.
- All exercise.json and collection files validate against the export's
  schemas. **No LaTeX was compiled**: look at the preview.

## Worth checking in the preview

- Very large or small values without an SI prefix are printed with
  `\XP{0}{2}` (e.g. 2.3·10³⁹); the crystal oscillation in oscillations prints
  "13 Pm/s²".
- Some quantities were renamed to avoid clashes with siunitx shortcuts
  (mA, mW, mL, ng, ns, ...).
- Some coulomb solutions use `\ce{}` (mhchem).
- The impedance metal detector gives both peak frequencies in the text, as
  a 1 % shift can't be read off a printed graph.
- The TikZ graphs are about 10 cm wide.
