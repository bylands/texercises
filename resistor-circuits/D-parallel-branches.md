# Resistor Circuit D: Parallel Branches

1. 
\NewQty{Itot}{14}[\milli\ampere]
\NewQty{Ib}{8}[\milli\ampere]
\NewQty{Ra}{1}[\kilo\ohm]
\NewQty{Rb}{3}[\kilo\ohm]

\SolQty{V}[I_b R_b]{\IbX*\RbX}[\volt]
\SolQty{I}[\ssc{I}{tot}-I_b]{\ItotX-\IbX}[\milli\ampere]
\SolQty{R}[\frac{I_b R_b}{\ssc{I}{tot}-I_b}-R_a]{\IbX*\RbX/(\ItotX-\IbX)-\RaX}[\kilo\ohm]
\SolQty{Va}[(\ssc{I}{tot}-I_b)R_a]{(\ItotX-\IbX)*\RaX}[\volt]
\SolQty{VR}[I_b R_b-(\ssc{I}{tot}-I_b)R_a]{\IbX*\RbX-(\ItotX-\IbX)*\RaX}[\volt]

2. 
Applying the rules for voltage and current dividers, find the voltage $V$ of the battery, the resistance $R$ and the current $I$ in the circuit below.

\begin{center}
\begin{circuitikz}[european resistors]
 \draw (0,0) to[battery1, invert, l=$V$] (0,4)
   to[short, i={\ItotO}] (3,4)
   to[R, l=$R$] (3,2)
   to[R, l={\RaO}, i=$I$] (3,0);
 \draw (3,4) -- (5.5,4) to[R, l={\RbO}, i={\IbO}] (5.5,0) -- (0,0);
\end{circuitikz}
\end{center}

3. 
The diagram shows all currents (blue) and voltages (red) in the circuit.

\begin{center}
\begin{circuitikz}[european resistors, >=latex, cur/.style={blue, thick, ->}, vol/.style={red, thick, ->}]
 \draw (0,0) to[battery1, invert] (0,4) -- (6.5,4)
   to[R, l={\RbO}] (6.5,0) -- (0,0);
 \draw (3,4) to[R, l={$R = \RP{0}{1}$}] (3,2) to[R, l={\RaO}] (3,0);
 \draw[cur] (1.3,4) -- (1.7,4) node[midway, above] {\ItotO};
 \draw[cur] (3,2.2) -- (3,1.8) node[midway, right] {$I = \IP{0}{1}$};
 \draw[cur] (6.5,0.5) -- (6.5,0.1) node[midway, right] {\IbO};
 \draw[vol] (-0.4,2.75) to[bend right=35] node[midway, left] {\VP{0}{2}} (-0.4,1.25);
 \draw[vol] (2.6,3.6) to[bend right=35] node[midway, left] {\VRP{0}{2}} (2.6,2.4);
 \draw[vol] (2.6,1.6) to[bend right=35] node[midway, left] {\VaP{0}{1}} (2.6,0.4);
 \draw[vol] (6.1,2.75) to[bend right=35] node[midway, left] {\VP{0}{2}} (6.1,1.25);
\end{circuitikz}
\end{center}

The right branch with $R_b = \RbO$ is connected directly to the battery, so the battery voltage is
\begin{align}
 V &= \VF \\
   &= \IbO\times\RbO \\
   &= \result{\VP{0}{2}}
\end{align}

The total current $\ssc{I}{tot}$ splits into the two branches. The current in the left branch is
\begin{align}
 I &= \IF \\
   &= \ItotO - \IbO \\
   &= \result{\IP{0}{1}}
\end{align}

The left branch consists of $R$ and $R_a = \RaO$ in series and is also connected to the full battery voltage, $V = I\,(R+R_a)$. Hence
\begin{align}
 R &= \frac{V}{I} - R_a = \RF \\
   &= \frac{\IbO\times\RbO}{\ItotO-\IbO}-\RaO \\
   &= \result{\RP{0}{1}}
\end{align}

According to the voltage divider rule, the battery voltage is split in the ratio $R:R_a = 3:1$ in the left branch, i.e. $\VRP{0}{2}$ across $R$ and $\VaP{0}{1}$ across $R_a$.

4. 
$V = \VP{0}{2}$, $R = \RP{0}{1}$, $I = \IP{0}{1}$
