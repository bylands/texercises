# Resistor Circuit A: Series Resistors

1. 
\NewQty{V}{12}[\volt]
\NewQty{Ra}{4}[\kilo\ohm]
\NewQty{I}{2}[\milli\ampere]

\SolQty{R}[\frac{V}{I}-R_a]{\VX/\IX-\RaX}[\kilo\ohm]
\SolQty{Va}[I R_a]{\IX*\RaX}[\volt]
\SolQty{VR}[V-I R_a]{\VX-\IX*\RaX}[\volt]

2. 
Applying the rules for voltage and current dividers, find the resistance $R$ in the circuit below.

\begin{center}
\begin{circuitikz}[european resistors]
 \draw (0,0) to[battery1, invert, l={\VO}] (0,2.5)
   to[R, l={\RaO}] (3,2.5)
   to[R, l=$R$] (6,2.5)
   to[short, i={\IO}] (6,0) -- (0,0);
\end{circuitikz}
\end{center}

3. 
The diagram shows all currents (blue) and voltages (red) in the circuit.

\begin{center}
\begin{circuitikz}[european resistors, >=latex, cur/.style={blue, thick, ->}, vol/.style={red, thick, ->}]
 \draw (0,0) to[battery1, invert] (0,2.5)
   to[R, l={\RaO}] (3,2.5)
   to[R, l={$R = \RP{0}{1}$}] (6,2.5)
   -- (6,0) -- (0,0);
 \draw[cur] (6,1.45) -- (6,1.05) node[right] {\IO};
 \draw[vol] (-0.4,2) to[bend right=35] node[midway, left] {\VO} (-0.4,0.5);
 \draw[vol] (0.8,2.15) to[bend right=35] node[midway, below] {\VaP{0}{1}} (2.2,2.15);
 \draw[vol] (3.8,2.15) to[bend right=35] node[midway, below] {\VRP{0}{1}} (5.2,2.15);
\end{circuitikz}
\end{center}

Both resistors carry the same current $I$, so their resistances add up to the total resistance of the circuit:
\begin{align}
 R_a + R &= \frac{V}{I}
\end{align}
where $R_a = \RaO$. Solving for $R$ yields
\begin{align}
 R &= \RF \\
   &= \frac{\VO}{\IO} - \RaO \\
   &= \result{\RP{0}{1}}
\end{align}

Check with the voltage divider rule: the voltage across $R_a$ is $I R_a = \VaP{0}{1}$, leaving $\VRP{0}{1}$ for $R$. The voltages are split in the ratio $2:1$, and so are the resistances.

4. 
$\RP{0}{1}$
