# Resistor Circuit L: Unknown Series Resistor

1. 
\NewQty{V}{24}[\volt]
\NewQty{Rone}{4}[\kilo\ohm]
\NewQty{Rtwo}{2}[\kilo\ohm]
\NewQty{Rthree}{3}[\kilo\ohm]
\NewQty{Rfour}{6}[\kilo\ohm]
\NewQty{Ifour}{1}[\milli\ampere]

\SolQty{Vq}[I_4 R_4]{\IfourX*\RfourX}[\volt]
\SolQty{Ithree}[\frac{V_{34}}{R_3}]{\VqX/\RthreeX}[\milli\ampere]
\SolQty{Ib}[I_3+I_4]{\IthreeX+\IfourX}[\milli\ampere]
\SolQty{Vtwo}[I_b R_2]{\IbX*\RtwoX}[\volt]
\SolQty{Vone}[V_2+V_{34}]{\VtwoX+\VqX}[\volt]
\SolQty{Ione}[\frac{V_1}{R_1}]{\VoneX/\RoneX}[\milli\ampere]
\SolQty{I}[I_1+I_b]{\IoneX+\IbX}[\milli\ampere]
\SolQty{VR}[V-V_1]{\VX-\VoneX}[\volt]
\SolQty{R}[\frac{V-V_1}{I}]{(\VX-\VoneX)/\IX}[\kilo\ohm]

2. 
Applying the rules for voltage and current dividers, find the resistance $R$, the battery current $I$ and the voltage $V_1$ across the \RoneO\ resistor in the circuit below.

\begin{center}
\begin{circuitikz}[european resistors]
 \draw (0,0) to[battery1, invert, l={\VO}] (0,3)
   to[short, i=$I$] (1,3)
   to[R, l=$R$] (3,3)
   to[R, l={\RoneO}] (3,0);
 \draw (3,3) to[R, l={\RtwoO}] (5.5,3)
   to[R, l={\RthreeO}] (5.5,0);
 \draw (5.5,3) -- (8,3) to[R, l={\RfourO}, i={\IfourO}] (8,0) -- (0,0);
\end{circuitikz}
\end{center}

3. 
The diagram shows all currents (blue) and voltages (red) in the circuit.

\begin{center}
\begin{circuitikz}[european resistors, >=latex, cur/.style={blue, thick, ->}, vol/.style={red, thick, ->}]
 \draw (0,0) to[battery1, invert] (0,3) -- (1,3)
   to[R, l={$R = \RP{0}{1}$}] (3.5,3)
   to[R, l={$R_1 = \RoneO$}] (3.5,0);
 \draw (3.5,3) to[R, l={$R_2 = \RtwoO$}] (7.5,3)
   to[R, l={$R_3 = \RthreeO$}] (7.5,0);
 \draw (7.5,3) -- (11.5,3) to[R, l={$R_4 = \RfourO$}] (11.5,0) -- (0,0);
 \draw[cur] (0.3,3) -- (0.7,3) node[midway, above] {$I = \IP{0}{1}$};
 \draw[cur] (3.5,0.7) -- (3.5,0.3) node[midway, right] {\IoneP{0}{1}};
 \draw[cur] (3.8,3) -- (4.2,3) node[midway, above] {\IbP{0}{1}};
 \draw[cur] (7.5,0.7) -- (7.5,0.3) node[midway, right] {\IthreeP{0}{1}};
 \draw[cur] (11.5,0.7) -- (11.5,0.3) node[midway, right] {\IfourO};
 \draw[vol] (-0.4,2.25) to[bend right=35] node[midway, left] {\VO} (-0.4,0.75);
 \draw[vol] (1.55,2.55) to[bend right=35] node[midway, below] {\VRP{0}{2}} (2.95,2.55);
 \draw[vol] (3.1,2) to[bend right=35] node[midway, left] {$V_1 = \VoneP{0}{2}$} (3.1,1);
 \draw[vol] (4.8,2.55) to[bend right=35] node[midway, below] {\VtwoP{0}{1}} (6.2,2.55);
 \draw[vol] (7.1,2) to[bend right=35] node[midway, left] {\VqP{0}{1}} (7.1,1);
 \draw[vol] (11.1,2) to[bend right=35] node[midway, left] {\VqP{0}{1}} (11.1,1);
\end{circuitikz}
\end{center}

Let $R_1 = \RoneO$ be the resistor in the middle branch. The right branch consists of $R_2 = \RtwoO$ in series with the parallel pair $R_3 = \RthreeO$ and $R_4 = \RfourO$. The only given current is $I_4 = \IfourO$ through $R_4$, so we start at the far right and work towards the battery.

The voltage across the parallel pair is
\begin{align}
 V_{34} &= \VqF = \IfourO\times\RfourO = \VqP{0}{1}
\end{align}
$R_3$ is at the same voltage and carries
\begin{align}
 I_3 &= \IthreeF = \frac{\VqP{0}{1}}{\RthreeO} = \IthreeP{0}{1}
\end{align}
Both currents flow through $R_2$:
\begin{align}
 I_b &= \IbF = \IthreeP{0}{1}+\IfourO = \IbP{0}{1}
\end{align}
so the voltage across $R_2$ is $V_2 = \VtwoF = \VtwoP{0}{1}$.

The middle branch is in parallel with the whole right branch. Its voltage is
\begin{align}
 V_1 &= \VoneF \\
   &= \VtwoP{0}{1}+\VqP{0}{1} \\
   &= \result{\VoneP{0}{2}}
\end{align}

The current through $R_1$ is $I_1 = \IoneF = \IoneP{0}{1}$, and the battery current splits into $I_1$ and $I_b$:
\begin{align}
 I &= \IF \\
   &= \IoneP{0}{1}+\IbP{0}{1} \\
   &= \result{\IP{0}{1}}
\end{align}

The rest of the battery voltage drops across $R$, which carries the full battery current:
\begin{align}
 R &= \RF \\
   &= \frac{\VO-\VoneP{0}{2}}{\IP{0}{1}} \\
   &= \result{\RP{0}{1}}
\end{align}

4. 
$R = \RP{0}{1}$, $I = \IP{0}{1}$, $V_1 = \VoneP{0}{2}$
