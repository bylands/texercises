# Resistor Circuit B: Parallel Resistors

1. 
\NewQty{I}{5}[\milli\ampere]
\NewQty{Ia}{2}[\milli\ampere]
\NewQty{Ra}{15}[\kilo\ohm]

\SolQty{V}[I_a R_a]{\IaX*\RaX}[\volt]
\SolQty{IR}[I-I_a]{\IX-\IaX}[\milli\ampere]
\SolQty{R}[\frac{I_a}{I-I_a}\,R_a]{\IaX/(\IX-\IaX)*\RaX}[\kilo\ohm]

2. 
Applying the rules for voltage and current dividers, find the voltage $V$ of the battery and the resistance $R$ in the circuit below.

\begin{center}
\begin{circuitikz}[european resistors]
 \draw (0,0) to[battery1, invert, l=$V$] (0,3)
   to[short, i={\IO}] (3,3)
   to[R, l={\RaO}, i={\IaO}] (3,0);
 \draw (3,3) -- (5,3) to[R, l=$R$] (5,0) -- (0,0);
\end{circuitikz}
\end{center}

3. 
The diagram shows all currents (blue) and voltages (red) in the circuit.

\begin{center}
\begin{circuitikz}[european resistors, >=latex, cur/.style={blue, thick, ->}, vol/.style={red, thick, ->}]
 \draw (0,0) to[battery1, invert] (0,3) -- (6.5,3)
   to[R, l={$R = \RP{0}{2}$}] (6.5,0) -- (0,0);
 \draw (3,3) to[R, l={\RaO}] (3,0);
 \draw[cur] (1.3,3) -- (1.7,3) node[midway, above] {\IO};
 \draw[cur] (3,0.7) -- (3,0.3) node[midway, right] {\IaO};
 \draw[cur] (6.5,0.7) -- (6.5,0.3) node[midway, right] {\IRP{0}{1}};
 \draw[vol] (-0.4,2.25) to[bend right=35] node[midway, left] {\VP{0}{2}} (-0.4,0.75);
 \draw[vol] (2.6,2.25) to[bend right=35] node[midway, left] {\VP{0}{2}} (2.6,0.75);
 \draw[vol] (6.1,2.25) to[bend right=35] node[midway, left] {\VP{0}{2}} (6.1,0.75);
\end{circuitikz}
\end{center}

Both resistors are connected directly to the battery, so the battery voltage equals the voltage across $R_a = \RaO$:
\begin{align}
 V &= \VF \\
   &= \IaO\times\RaO \\
   &= \result{\VP{0}{2}}
\end{align}

The total current splits at the junction, so the current through $R$ is
\begin{align}
 I_R &= \IRF = \IRP{0}{1}
\end{align}

According to the current divider rule, the currents are inversely proportional to the resistances, $I_R/I_a = R_a/R$. Therefore
\begin{align}
 R &= \RF \\
   &= \frac{\IaO}{\IO-\IaO}\times\RaO \\
   &= \result{\RP{0}{2}}
\end{align}

4. 
$\VP{0}{2}$, $\RP{0}{2}$
