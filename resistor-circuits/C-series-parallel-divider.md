# Resistor Circuit C: Voltage Divider with Parallel Load

1. 
\NewQty{V}{25}[\volt]
\NewQty{Ra}{2}[\kilo\ohm]
\NewQty{Rb}{2}[\kilo\ohm]
\NewQty{Rc}{4}[\kilo\ohm]

\SolQty{Rp}[\left(\frac{1}{R_1}+\frac{1}{R_2}\right)^{-1}]{1/(1/\RbX+1/\RcX)}[\kilo\ohm]
\SolQty{It}[\frac{V}{R_a+\left(\frac{1}{R_1}+\frac{1}{R_2}\right)^{-1}}]{\VX/(\RaX+\RpX)}[\milli\ampere]
\SolQty{Va}[\frac{R_a}{R_a+\left(\frac{1}{R_1}+\frac{1}{R_2}\right)^{-1}}\,V]{\ItX*\RaX}[\volt]
\SolQty{Vp}[\frac{R_p}{R_a+R_p}\,V]{\RpX/(\RaX+\RpX)*\VX}[\volt]
\SolQty{Ione}[\frac{V_p}{R_1}]{\VpX/\RbX}[\milli\ampere]
\SolQty{Itwo}[\frac{V_p}{R_2}]{\VpX/\RcX}[\milli\ampere]

2. 
Applying the rules for voltage and current dividers, find the currents $I_1$ and $I_2$ in the circuit below.

\begin{center}
\begin{circuitikz}[european resistors]
 \draw (0,0) to[battery1, invert, l={\VO}] (0,3)
   to[R, l={\RaO}] (3,3)
   to[R, l={\RbO}, i=$I_1$] (3,0);
 \draw (3,3) -- (5,3) to[R, l={\RcO}, i=$I_2$] (5,0) -- (0,0);
\end{circuitikz}
\end{center}

3. 
The diagram shows all currents (blue) and voltages (red) in the circuit.

\begin{center}
\begin{circuitikz}[european resistors, >=latex, cur/.style={blue, thick, ->}, vol/.style={red, thick, ->}]
 \draw (0,0) to[battery1, invert] (0,3)
   to[R, l={\RaO}] (3,3) -- (6.5,3)
   to[R, l={\RcO}] (6.5,0) -- (0,0);
 \draw (3,3) to[R, l={\RbO}] (3,0);
 \draw[cur] (1.7,0) -- (1.3,0) node[midway, below] {\ItP{0}{2}};
 \draw[cur] (3,0.7) -- (3,0.3) node[midway, right] {$I_1 = \IoneP{0}{1}$};
 \draw[cur] (6.5,0.7) -- (6.5,0.3) node[midway, right] {$I_2 = \ItwoP{0}{2}$};
 \draw[vol] (-0.4,2.25) to[bend right=35] node[midway, left] {\VO} (-0.4,0.75);
 \draw[vol] (0.8,2.65) to[bend right=35] node[midway, below] {\VaP{0}{2}} (2.2,2.65);
 \draw[vol] (2.6,2) to[bend right=35] node[midway, left] {\VpP{0}{2}} (2.6,1);
 \draw[vol] (6.1,2) to[bend right=35] node[midway, left] {\VpP{0}{2}} (6.1,1);
\end{circuitikz}
\end{center}

Let $R_a = \RaO$ be the resistor in series with the battery, and $R_1 = \RbO$ and $R_2 = \RcO$ the two resistors in parallel. The parallel combination has the resistance
\begin{align}
 R_p &= \RpF \\
   &= \left(\frac{1}{\RbO}+\frac{1}{\RcO}\right)^{-1} \\
   &= \frac{4}{3}\,\si{\kilo\ohm}
\end{align}

$R_a$ and $R_p$ form a voltage divider. The voltage across the parallel resistors is
\begin{align}
 V_p &= \VpF \\
   &= \frac{\dfrac{4}{3}\,\si{\kilo\ohm}}{\RaO+\dfrac{4}{3}\,\si{\kilo\ohm}}\times\VO \\
   &= \frac{\dfrac{4}{3}}{\dfrac{6}{3}+\dfrac{4}{3}}\times\VO = \frac{\dfrac{4}{3}}{\dfrac{10}{3}}\times\VO = \frac{4}{10}\times\VO \\
   &= \VpP{0}{2}
\end{align}

Both parallel resistors are at the voltage $V_p$, so the currents follow from Ohm's law:
\begin{align}
 I_1 &= \IoneF \\
   &= \frac{\VpP{0}{2}}{\RbO} \\
   &= \result{\IoneP{0}{1}} \\
 I_2 &= \ItwoF \\
   &= \frac{\VpP{0}{2}}{\RcO} \\
   &= \result{\ItwoP{0}{2}}
\end{align}

As expected from the current divider rule, the smaller resistor carries twice the current of the larger one. Together, the two currents give the current $I = \ItP{0}{2}$ through $R_a$, which drops a voltage of $I R_a = \VaP{0}{2}$. Together with $V_p$, that adds up to the battery voltage.

4. 
$I_1 = \IoneP{0}{1}$, $I_2 = \ItwoP{0}{2}$
