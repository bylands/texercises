# Resistor Circuit J: Two Parallel Pairs in Series

1. 
\NewQty{Ra}{6}[\kilo\ohm]
\NewQty{Rb}{12}[\kilo\ohm]
\NewQty{Rc}{6}[\kilo\ohm]
\NewQty{Ia}{2}[\milli\ampere]
\NewQty{Ic}{4}[\milli\ampere]

\SolQty{Vone}[I_a R_a]{\IaX*\RaX}[\volt]
\SolQty{Vtwo}[I_c R_c]{\IcX*\RcX}[\volt]
\SolQty{V}[V_1+V_2]{\VoneX+\VtwoX}[\volt]
\SolQty{I}[\frac{V_2}{R_b}]{\VtwoX/\RbX}[\milli\ampere]
\SolQty{Itot}[I+I_c]{\IX+\IcX}[\milli\ampere]
\SolQty{IR}[\ssc{I}{tot}-I_a]{\ItotX-\IaX}[\milli\ampere]
\SolQty{R}[\frac{V_1}{I_R}]{\VoneX/\IRX}[\kilo\ohm]

2. 
Applying the rules for voltage and current dividers, find the voltage $V$ of the battery, the resistance $R$ and the current $I$ in the circuit below.

\begin{center}
\begin{circuitikz}[european resistors]
 \draw (0,0) to[battery1, invert, l=$V$] (0,5) -- (5,5);
 \draw (2,5) to[R, l={\RaO}, i={\IaO}] (2,2.5)
   to[R, l={\RbO}, i=$I$] (2,0);
 \draw (5,5) to[R, l=$R$] (5,2.5)
   to[R, l={\RcO}, i={\IcO}] (5,0) -- (0,0);
 \draw (2,2.5) -- (5,2.5);
\end{circuitikz}
\end{center}

3. 
The diagram shows all currents (blue) and voltages (red) in the circuit.

\begin{center}
\begin{circuitikz}[european resistors, >=latex, cur/.style={blue, thick, ->}, vol/.style={red, thick, ->}]
 \draw (0,0) to[battery1, invert] (0,5) -- (6.5,5);
 \draw (2.5,5) to[R, l={$R_a = \RaO$}] (2.5,2.5)
   to[R, l={$R_b = \RbO$}] (2.5,0);
 \draw (6.5,5) to[R, l={$R = \RP{0}{1}$}] (6.5,2.5)
   to[R, l={$R_c = \RcO$}] (6.5,0) -- (0,0);
 \draw (2.5,2.5) -- (6.5,2.5);
 \draw[cur] (1.05,5) -- (1.45,5) node[midway, above] {\ItotP{0}{1}};
 \draw[cur] (2.5,3.15) -- (2.5,2.8) node[midway, right] {\IaO};
 \draw[cur] (6.5,3.15) -- (6.5,2.8) node[midway, right] {\IRP{0}{1}};
 \draw[cur] (2.5,0.65) -- (2.5,0.3) node[midway, right] {$I = \IP{0}{1}$};
 \draw[cur] (6.5,0.65) -- (6.5,0.3) node[midway, right] {\IcO};
 \draw[vol] (-0.4,3.25) to[bend right=35] node[midway, left] {\VP{0}{2}} (-0.4,1.75);
 \draw[vol] (2.1,4.25) to[bend right=35] node[midway, left] {\VoneP{0}{2}} (2.1,3.25);
 \draw[vol] (6.1,4.25) to[bend right=35] node[midway, left] {\VoneP{0}{2}} (6.1,3.25);
 \draw[vol] (2.1,1.75) to[bend right=35] node[midway, left] {\VtwoP{0}{2}} (2.1,0.75);
 \draw[vol] (6.1,1.75) to[bend right=35] node[midway, left] {\VtwoP{0}{2}} (6.1,0.75);
\end{circuitikz}
\end{center}

The circuit consists of two parallel pairs connected in series. In the upper pair, $R_a = \RaO$ carries the current $I_a = \IaO$. In the lower pair, $R_c = \RcO$ carries the current $I_c = \IcO$.

Both resistors of a pair are at the same voltage. The voltages across the upper and the lower pair follow from Ohm's law:
\begin{align}
 V_1 &= \VoneF = \IaO\times\RaO = \VoneP{0}{2} \\
 V_2 &= \VtwoF = \IcO\times\RcO = \VtwoP{0}{2}
\end{align}

The two pairs are in series, so their voltages add up to the battery voltage:
\begin{align}
 V &= \VF \\
   &= \VoneP{0}{2}+\VtwoP{0}{2} \\
   &= \result{\VP{0}{2}}
\end{align}

The current through $R_b = \RbO$ follows from the voltage across the lower pair:
\begin{align}
 I &= \IF \\
   &= \frac{\VtwoP{0}{2}}{\RbO} \\
   &= \result{\IP{0}{1}}
\end{align}

The battery current flows through both pairs. At the lower pair it splits into $I$ and $I_c$:
\begin{align}
 \ssc{I}{tot} &= \ItotF = \IP{0}{1}+\IcO = \ItotP{0}{1}
\end{align}
At the upper pair, the part that does not flow through $R_a$ flows through $R$:
\begin{align}
 I_R &= \IRF = \ItotP{0}{1}-\IaO = \IRP{0}{1}
\end{align}

$R$ is at the voltage $V_1$ of the upper pair. Hence
\begin{align}
 R &= \RF \\
   &= \frac{\VoneP{0}{2}}{\IRP{0}{1}} \\
   &= \result{\RP{0}{1}}
\end{align}

Check with the current divider rule: in the upper pair, $R$ carries twice the current of $R_a$ and has half its resistance.

4. 
$V = \VP{0}{2}$, $R = \RP{0}{1}$, $I = \IP{0}{1}$
