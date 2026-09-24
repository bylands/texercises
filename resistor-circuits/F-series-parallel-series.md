# Resistor Circuit F: Parallel Pair between Two Series Resistors

1. 
\NewQty{V}{44}[\volt]
\NewQty{I}{12}[\milli\ampere]
\NewQty{Ia}{4}[\milli\ampere]
\NewQty{Rb}{1}[\kilo\ohm]
\NewQty{Rc}{1}[\kilo\ohm]

\SolQty{Itwo}[I-I_a]{\IX-\IaX}[\milli\ampere]
\SolQty{Vp}[(I-I_a)R_b]{(\IX-\IaX)*\RbX}[\volt]
\SolQty{Rone}[\frac{I-I_a}{I_a}\,R_b]{(\IX-\IaX)/\IaX*\RbX}[\kilo\ohm]
\SolQty{Vc}[I R_c]{\IX*\RcX}[\volt]
\SolQty{VR}[V-I R_c-(I-I_a)R_b]{\VX-\IX*\RcX-(\IX-\IaX)*\RbX}[\volt]
\SolQty{R}[\frac{V-I R_c-(I-I_a)R_b}{I}]{(\VX-\IX*\RcX-(\IX-\IaX)*\RbX)/\IX}[\kilo\ohm]

2. 
Applying the rules for voltage and current dividers, find the resistances $R$ and $R_1$ and the current $I_2$ in the circuit below.

\begin{center}
\begin{circuitikz}[european resistors]
 \draw (0,0) to[battery1, invert, l={\VO}] (0,3)
   to[short, i={\IO}] (1,3)
   to[R, l=$R$] (3,3)
   to[R, l=$R_1$, i={\IaO}] (3,0);
 \draw (3,3) -- (5,3) to[R, l={\RbO}, i=$I_2$] (5,0)
   -- (3,0) to[R, l={\RcO}] (0,0);
\end{circuitikz}
\end{center}

3. 
The diagram shows all currents (blue) and voltages (red) in the circuit.

\begin{center}
\begin{circuitikz}[european resistors, >=latex, cur/.style={blue, thick, ->}, vol/.style={red, thick, ->}]
 \draw (0,0) to[battery1, invert] (0,3) -- (1,3)
   to[R, l={$R = \RP{0}{1}$}] (3.5,3)
   to[R, l={$R_1 = \RoneP{0}{1}$}] (3.5,0);
 \draw (3.5,3) -- (7,3) to[R, l={\RbO}] (7,0)
   -- (3.5,0) to[R, l={\RcO}] (1,0) -- (0,0);
 \draw[cur] (0.3,3) -- (0.7,3) node[midway, above] {\IO};
 \draw[cur] (3.5,0.7) -- (3.5,0.3) node[midway, right] {\IaO};
 \draw[cur] (7,0.7) -- (7,0.3) node[midway, right] {$I_2 = \ItwoP{0}{1}$};
 \draw[vol] (-0.4,2.25) to[bend right=35] node[midway, left] {\VO} (-0.4,0.75);
 \draw[vol] (1.55,2.65) to[bend right=35] node[midway, below] {\VRP{0}{2}} (2.95,2.65);
 \draw[vol] (3.1,2) to[bend right=35] node[midway, left] {\VpP{0}{1}} (3.1,1);
 \draw[vol] (6.6,2) to[bend right=35] node[midway, left] {\VpP{0}{1}} (6.6,1);
 \draw[vol] (2.95,0.35) to[bend right=35] node[midway, above] {\VcP{0}{2}} (1.55,0.35);
\end{circuitikz}
\end{center}

The battery current $I = \IO$ splits into the currents through $R_1$ and through the parallel resistor $R_b = \RbO$:
\begin{align}
 I_2 &= \ItwoF \\
   &= \IO - \IaO \\
   &= \result{\ItwoP{0}{1}}
\end{align}

$R_1$ and $R_b$ share the voltage $V_p = I_2 R_b = \VpF = \VpP{0}{1}$. Hence
\begin{align}
 R_1 &= \frac{V_p}{I_a} = \RoneF \\
   &= \frac{\IO-\IaO}{\IaO}\times\RbO \\
   &= \result{\RoneP{0}{1}}
\end{align}

The full current $I$ flows through $R$, the parallel pair and $R_c = \RcO$ in series, so the battery voltage is divided as
\begin{align}
 V &= I R + V_p + I R_c
\end{align}
Solving for $R$:
\begin{align}
 R &= \RF \\
   &= \frac{\VO-\IO\times\RcO-(\IO-\IaO)\times\RbO}{\IO} \\
   &= \result{\RP{0}{1}}
\end{align}

The voltages across $R$, the parallel pair and $R_c$ are $\VRP{0}{2}$, $\VpP{0}{1}$ and $\VcP{0}{2}$, which add up to $\VO$.

4. 
$R = \RP{0}{1}$, $R_1 = \RoneP{0}{1}$, $I_2 = \ItwoP{0}{1}$
