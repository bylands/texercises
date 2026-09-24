# Resistor Circuit K: Three Resistors in Parallel

1. 
\NewQty{V}{18}[\volt]
\NewQty{Ra}{2}[\kilo\ohm]
\NewQty{Rone}{2}[\kilo\ohm]
\NewQty{Rtwo}{3}[\kilo\ohm]
\NewQty{IR}{1}[\milli\ampere]

\SolQty{Vp}[\frac{\dfrac{V}{R_a}-I_R}{\dfrac{1}{R_a}+\dfrac{1}{R_1}+\dfrac{1}{R_2}}]{(\VX/\RaX-\IRX)/(1/\RaX+1/\RoneX+1/\RtwoX)}[\volt]
\SolQty{R}[\frac{V_p}{I_R}]{\VpX/\IRX}[\kilo\ohm]
\SolQty{Va}[V-V_p]{\VX-\VpX}[\volt]
\SolQty{I}[\frac{V-V_p}{R_a}]{(\VX-\VpX)/\RaX}[\milli\ampere]
\SolQty{Ione}[\frac{V_p}{R_1}]{\VpX/\RoneX}[\milli\ampere]
\SolQty{Itwo}[\frac{V_p}{R_2}]{\VpX/\RtwoX}[\milli\ampere]

2. 
Applying the rules for voltage and current dividers, find the voltage $V_p$ across the parallel resistors, the resistance $R$ and the battery current $I$ in the circuit below.

\begin{center}
\begin{circuitikz}[european resistors]
 \draw (0,0) to[battery1, invert, l={\VO}] (0,3)
   to[R, l={\RaO}] (2.5,3)
   to[R, l={\RoneO}] (2.5,0);
 \draw (2.5,3) -- (4.5,3) to[R, l={\RtwoO}] (4.5,0);
 \draw (4.5,3) -- (6.5,3) to[R, l=$R$, i={\IRO}] (6.5,0)
   -- (2.5,0) to[short, i=$I$] (0,0);
\end{circuitikz}
\end{center}

3. 
The diagram shows all currents (blue) and voltages (red) in the circuit.

\begin{center}
\begin{circuitikz}[european resistors, >=latex, cur/.style={blue, thick, ->}, vol/.style={red, thick, ->}]
 \draw (0,0) to[battery1, invert] (0,3)
   to[R, l={$R_a = \RaO$}] (3,3)
   to[R, l={$R_1 = \RoneO$}] (3,0);
 \draw (3,3) -- (6.5,3) to[R, l={$R_2 = \RtwoO$}] (6.5,0);
 \draw (6.5,3) -- (10,3) to[R, l={$R = \RP{0}{1}$}] (10,0) -- (0,0);
 \draw[cur] (1.7,0) -- (1.3,0) node[midway, below] {$I = \IP{0}{1}$};
 \draw[cur] (3,0.7) -- (3,0.3) node[midway, right] {\IoneP{0}{1}};
 \draw[cur] (6.5,0.7) -- (6.5,0.3) node[midway, right] {\ItwoP{0}{1}};
 \draw[cur] (10,0.7) -- (10,0.3) node[midway, right] {\IRO};
 \draw[vol] (-0.4,2.25) to[bend right=35] node[midway, left] {\VO} (-0.4,0.75);
 \draw[vol] (0.8,2.55) to[bend right=35] node[midway, below] {\VaP{0}{2}} (2.2,2.55);
 \draw[vol] (2.6,2) to[bend right=35] node[midway, left] {\VpP{0}{1}} (2.6,1);
 \draw[vol] (6.1,2) to[bend right=35] node[midway, left] {\VpP{0}{1}} (6.1,1);
 \draw[vol] (9.6,2) to[bend right=35] node[midway, left] {\VpP{0}{1}} (9.6,1);
\end{circuitikz}
\end{center}

Let $R_a = \RaO$ be the resistor in series with the battery, and $R_1 = \RoneO$ and $R_2 = \RtwoO$ the two known resistors in parallel. The unknown resistor $R$ carries the current $I_R = \IRO$.

Neither the battery current nor the voltage $V_p$ is known. We therefore use the junction rule: the current through $R_a$ equals the sum of the currents in the three parallel branches. With Ohm's law, and since $R_a$ is at the voltage $V - V_p$,
\begin{align}
 \frac{V-V_p}{R_a} &= \frac{V_p}{R_1}+\frac{V_p}{R_2}+I_R
\end{align}
Collecting the terms with $V_p$ on one side yields
\begin{align}
 V_p &= \VpF \\
   &= \frac{\dfrac{\VO}{\RaO}-\IRO}{\dfrac{1}{\RaO}+\dfrac{1}{\RoneO}+\dfrac{1}{\RtwoO}} \\
   &= \frac{\qty{9}{\milli\ampere}-\IRO}{\dfrac{3}{\qty{6}{\kilo\ohm}}+\dfrac{3}{\qty{6}{\kilo\ohm}}+\dfrac{2}{\qty{6}{\kilo\ohm}}} = \frac{\qty{8}{\milli\ampere}}{\dfrac{8}{\qty{6}{\kilo\ohm}}} \\
   &= \result{\VpP{0}{1}}
\end{align}

The unknown resistor is at the same voltage, so
\begin{align}
 R &= \RF \\
   &= \frac{\VpP{0}{1}}{\IRO} \\
   &= \result{\RP{0}{1}}
\end{align}

The remaining $\VaP{0}{2}$ of the battery voltage drop across $R_a$:
\begin{align}
 I &= \IF \\
   &= \frac{\VO-\VpP{0}{1}}{\RaO} \\
   &= \result{\IP{0}{1}}
\end{align}

Check: the currents through $R_1$ and $R_2$ are $V_p/R_1 = \IoneP{0}{1}$ and $V_p/R_2 = \ItwoP{0}{1}$. Together with $I_R$ they add up to the battery current $I$.

4. 
$V_p = \VpP{0}{1}$, $R = \RP{0}{1}$, $I = \IP{0}{1}$
