---
name: texercise-solution
description: Write or edit the Solver, Exercise Text, Solution, and Short Solution parts of a TeXercises physics/math exercise, in the project's LaTeX macro syntax and house style. Use whenever asked to draft, write, or revise a TeXercises exercise or its solution.
---

Write in the TeXercises macro syntax described in [cheatsheet.md](../../../cheatsheet.md), following the structure and tone of [examples.md](../../../examples.md). Every exercise has four numbered parts: 1. Solver, 2. Exercise Text, 3. Solution, 4. Short Solution — match this structure even if only some parts are requested.

## General rules

- Use only the macros documented in the cheatsheet (`\NewQty`, `\SolQty`, `\ConvTo`, `\Geg`/`\Ges`/`\Lsg`, unit shortcuts, etc.). Don't invent macros.
- Quantity names are letters only and must not collide with a LaTeX command (e.g. use `ph` for a phase shift, not `phi`, since `\phi` already exists).
- Pick numeric example values that produce clean, "nice" results — e.g. Pythagorean triples (`50-120-130`, `90-120-150`) for anything of the form `sqrt(a^2+b^2)` — so the final rounded answer isn't an awkward fraction.
- Round final numeric results to 2 significant figures unless told otherwise.
- For every boxed/highlighted final value, use `\result{\XP{prefix}{sigfigs}}` (prefix as a power of ten, `0` for the base unit) — this is the convention used throughout examples.md (`\fcP{3}{2}`, `\ratioP{0}{2}`, `\VaP{-3}{2}`). Don't use `\XS{n}`, even though it's valid syntax: `P{}{}` also carries the unit, `S{n}` doesn't.
- Short Solution (part 4): one boxed `\result{...}` value per sub-question, comma-separated, e.g. `(a) $V_0/\sqrt{2}$, (b) $\fcP{3}{2}$, $\fP{0}{2}$`.
- Solution derivations (part 3) generally don't need `\Geg`/`\Ges`/`\Lsg` boxes — the worked examples go straight into `\begin{align}` blocks ending in `\approx \result{...}`.

## AC circuit impedance / phase-shift problems

This pattern (refined for resistor–capacitor/inductor circuits) generalizes to any series or parallel two-element AC network. Derive the result twice: once graphically with a phasor diagram, once with complex expressions.

**Phasor diagram (tikz):**
- Color voltage phasors red, current phasors blue — regardless of which one is the shared reference. In a series circuit the current is the shared quantity (single blue reference vector; red component vectors + red resultant). In a parallel circuit the voltage is shared (single red reference vector; blue component vectors + blue resultant).
- Draw the reference phasor along the Re axis, offset slightly (e.g. `y=10` instead of `y=0`) so it doesn't sit exactly on top of the colinear component vector.
- Draw the two component phasors (one along the reference direction, one perpendicular — up for a capacitor/leading behavior, down for an inductor/lagging behavior), then the resultant as one `ultra thick` arrow from the origin.
- Mark the phase angle φ with a small arc at the origin plus a label.

**Complex expressions:**
- Use a tilde for complex quantities (`\tilde Z`, `\tilde X_L`, `\tilde X_C`) — never an underscore.
- Name a complex reactance after the element's reactance symbol (`X_C`, `X_L`), not `Z_C`/`Z_L`.
- Series circuits: impedances add, `\tilde Z = R + \tilde X`.
- Parallel circuits: admittances add, `\tilde Y = 1/R + 1/\tilde X`, then `\tilde Z = 1/\tilde Y`.
- State the phase shift in radians unless the exercise specifies degrees.

Both derivations should land on the same `\ZP{0}{2}` / `\phP{0}{2}`-style boxed results, with the second derivation noted as confirming the first.

### Worked skeleton (series RC as reference)

```latex
% 1. Solver
\NewQty{R}{120}[\ohm]
\NewQty{XC}{50}[\ohm]

\SolQty{Z}[\sqrt{R^2+X_C^2}]{sqrt(\RX^2+\XCX^2)}[\ohm]
\SolQty{ph}[-\arctan\left(\frac{X_C}{R}\right)]{-atan(\XCX/\RX)}[\radian]
```

```latex
% 3. Solution (excerpt)
\begin{center}
\begin{tikzpicture}[>=stealth, scale=0.025]
 \draw[->] (-15,0) -- (140,0) node[right] {$\mathrm{Re}$};
 \draw[->] (0,-95) -- (0,25) node[above] {$\mathrm{Im}$};
 \draw[->, blue, thick] (0,10) -- (60,10) node[midway, above] {$I$};
 \draw[->, red, thick] (0,0) -- (100,0) node[midway, below] {$V_R$};
 \draw[->, red, thick] (100,0) -- (100,-75) node[midway, right] {$V_C$};
 \draw[->, red, ultra thick] (0,0) -- (100,-75) node[midway, below left] {$V$};
 \draw (30,0) arc (0:-22.6:30);
 \node at (35,-11) {$\varphi$};
\end{tikzpicture}
\end{center}
```

```latex
% 4. Short Solution
$\ZP{0}{2}$, $\phP{0}{2}$
```
