# Resistor Circuit G: Branch with Two Series Resistors

1. 
\NewQty{Itot}{9}[\milli\ampere]
\NewQty{Ic}{2}[\milli\ampere]
\NewQty{Ra}{2}[\kilo\ohm]
\NewQty{Rb}{2}[\kilo\ohm]
\NewQty{Rc}{4}[\kilo\ohm]

\SolQty{I}[\ssc{I}{tot}-I_c]{\ItotX-\IcX}[\milli\ampere]
\SolQty{Vp}[(\ssc{I}{tot}-I_c)R_b]{(\ItotX-\IcX)*\RbX}[\volt]
\SolQty{R}[\frac{\ssc{I}{tot}-I_c}{I_c}\,R_b-R_c]{(\ItotX-\IcX)/\IcX*\RbX-\RcX}[\kilo\ohm]
\SolQty{V}[\ssc{I}{tot}R_a+(\ssc{I}{tot}-I_c)R_b]{\ItotX*\RaX+(\ItotX-\IcX)*\RbX}[\volt]
\SolQty{Va}[\ssc{I}{tot}R_a]{\ItotX*\RaX}[\volt]
\SolQty{Vc}[I_c R_c]{\IcX*\RcX}[\volt]
\SolQty{VR}[(\ssc{I}{tot}-I_c)R_b-I_c R_c]{(\ItotX-\IcX)*\RbX-\IcX*\RcX}[\volt]

2. 
Applying the rules for voltage and current dividers, find the voltage $V$ of the battery, the resistance $R$ and the current $I$ in the circuit below.

\begin{center}
\begin{circuitikz}[european resistors]
 \draw (0,0) to[battery1, invert, l=$V$] (0,3)
   to[short, i={\ItotO}] (3,3)
   to[R, l={\RbO}, i=$I$] (3,0);
 \draw (3,3) to[R, l={\RcO}] (5.5,3)
   to[R, l=$R$, i={\IcO}] (5.5,0)
   -- (3,0) to[R, l={\RaO}] (0,0);
\end{circuitikz}
\end{center}

3. 
The diagram shows all currents (blue) and voltages (red) in the circuit.

\begin{center}
\begin{circuitikz}[european resistors, >=latex, cur/.style={blue, thick, ->}, vol/.style={red, thick, ->}]
 \draw (0,0) to[battery1, invert] (0,3) -- (3,3)
   to[R, l={\RbO}] (3,0);
 \draw (3,3) to[R, l={\RcO}] (6.5,3)
   to[R, l={$R = \RP{0}{1}$}] (6.5,0)
   -- (3,0) to[R, l={\RaO}] (0,0);
 \draw[cur] (1.3,3) -- (1.7,3) node[midway, above] {\ItotO};
 \draw[cur] (3,0.7) -- (3,0.3) node[midway, right] {$I = \IP{0}{1}$};
 \draw[cur] (6.5,0.7) -- (6.5,0.3) node[midway, right] {\IcO};
 \draw[vol] (-0.4,2.25) to[bend right=35] node[midway, left] {\VP{0}{2}} (-0.4,0.75);
 \draw[vol] (2.6,2) to[bend right=35] node[midway, left] {\VpP{0}{2}} (2.6,1);
 \draw[vol] (2.2,0.35) to[bend right=35] node[midway, above] {\VaP{0}{2}} (0.8,0.35);
 \draw[vol] (4.05,2.65) to[bend right=35] node[midway, below] {\VcP{0}{1}} (5.45,2.65);
 \draw[vol] (6.1,2) to[bend right=35] node[midway, left] {\VRP{0}{1}} (6.1,1);
\end{circuitikz}
\end{center}

The total current $\ssc{I}{tot} = \ItotO$ splits into the current $I$ through $R_b = \RbO$ and the current $I_c = \IcO$ through the right branch:
\begin{align}
 I &= \IF \\
   &= \ItotO - \IcO \\
   &= \result{\IP{0}{1}}
\end{align}

Both branches share the voltage $V_p = I R_b = \VpF = \VpP{0}{2}$. The right branch consists of $R_c = \RcO$ and $R$ in series, so $V_p = I_c\,(R_c + R)$ and
\begin{align}
 R &= \frac{V_p}{I_c} - R_c = \RF \\
   &= \frac{\ItotO-\IcO}{\IcO}\times\RbO - \RcO \\
   &= \result{\RP{0}{1}}
\end{align}

The battery voltage is the sum of the voltage across $R_a = \RaO$, which carries the total current, and the voltage across the parallel part:
\begin{align}
 V &= \VF \\
   &= \ItotO\times\RaO + (\ItotO-\IcO)\times\RbO \\
   &= \result{\VP{0}{2}}
\end{align}

4. 
$V = \VP{0}{2}$, $R = \RP{0}{1}$, $I = \IP{0}{1}$
