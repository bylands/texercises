# Resistor Circuit H: Diagonal Resistor

1. 
\NewQty{V}{54}[\volt]
\NewQty{I}{6}[\milli\ampere]
\NewQty{Ia}{2}[\milli\ampere]
\NewQty{Ra}{8}[\kilo\ohm]
\NewQty{Rb}{12}[\kilo\ohm]

\SolQty{Itwo}[I-I_a]{\IX-\IaX}[\milli\ampere]
\SolQty{Vp}[(I-I_a)R_b]{(\IX-\IaX)*\RbX}[\volt]
\SolQty{Rone}[\frac{I-I_a}{I_a}\,R_b-R_a]{(\IX-\IaX)/\IaX*\RbX-\RaX}[\kilo\ohm]
\SolQty{Rtwo}[\frac{V-(I-I_a)R_b}{I}]{(\VX-(\IX-\IaX)*\RbX)/\IX}[\kilo\ohm]
\SolQty{Vone}[(I-I_a)R_b-I_a R_a]{(\IX-\IaX)*\RbX-\IaX*\RaX}[\volt]
\SolQty{Va}[I_a R_a]{\IaX*\RaX}[\volt]
\SolQty{Vtwo}[V-(I-I_a)R_b]{\VX-(\IX-\IaX)*\RbX}[\volt]

2. 
Applying the rules for voltage and current dividers, find the resistances $R_1$ and $R_2$ and the current $I_2$ in the circuit below.

\begin{center}
\begin{circuitikz}[european resistors]
 \draw (0,0) to[battery1, invert, l={\VO}] (0,2.5)
   to[short, i={\IO}] (0,4)
   to[R, l=$R_1$, i={\IaO}] (4.5,4)
   to[R, l={\RaO}] (4.5,0)
   to[R, l=$R_2$] (0,0);
 \draw (0,4) to[R, i=$I_2$] (4.5,0);
 \node[below left] at (2.0,1.9) {\RbO};
\end{circuitikz}
\end{center}

3. 
The diagram shows all currents (blue) and voltages (red) in the circuit.

\begin{center}
\begin{circuitikz}[european resistors, >=latex, cur/.style={blue, thick, ->}, vol/.style={red, thick, ->}]
 \draw (0,0) to[battery1, invert] (0,2.5) -- (0,4)
   to[R, l={$R_1 = \RoneP{0}{2}$}] (4.5,4)
   to[R, l_={\RaO}] (4.5,0)
   to[R, l={$R_2 = \RtwoP{0}{1}$}] (0,0);
 \draw (0,4) to[R] (4.5,0);
 \node[below left] at (2.0,1.9) {\RbO};
 \draw[cur] (0,3.05) -- (0,3.45) node[midway, left] {\IO};
 \draw[cur] (4.5,3.6) -- (4.5,3.2) node[midway, right] {\IaO};
 \draw[cur] (3.51,0.88) -- (3.87,0.56) node[midway, above right] {$I_2 = \ItwoP{0}{1}$};
 \draw[cur] (1.0,0) -- (0.6,0) node[midway, below] {\IO};
 \draw[vol] (-0.4,2) to[bend right=35] node[midway, left] {\VO} (-0.4,0.5);
 \draw[vol] (1.55,3.65) to[bend right=35] node[midway, below] {\VoneP{0}{2}} (2.95,3.65);
 \draw[vol] (5,2.7) to[bend left=35] node[midway, right] {\VaP{0}{2}} (5,1.3);
 \draw[vol] (1.76,2.83) to[bend left=35] node[midway, above right] {\VpP{0}{2}} (3.11,1.63);
 \draw[vol] (2.95,0.35) to[bend right=35] node[midway, above] {\VtwoP{0}{1}} (1.55,0.35);
\end{circuitikz}
\end{center}

The diagonal resistor $R_b = \RbO$ is connected in parallel with the series combination of $R_1$ and $R_a = \RaO$. This parallel part is in series with $R_2$, which carries the full battery current $I = \IO$.

The battery current splits into the current $I_a = \IaO$ through the upper path and the current through the diagonal:
\begin{align}
 I_2 &= \ItwoF \\
   &= \IO - \IaO \\
   &= \result{\ItwoP{0}{1}}
\end{align}

The voltage across the parallel part is $V_p = I_2 R_b = \VpF = \VpP{0}{2}$. The upper path carries $I_a$ at the same voltage, $V_p = I_a\,(R_1+R_a)$, so
\begin{align}
 R_1 &= \frac{V_p}{I_a} - R_a = \RoneF \\
   &= \frac{\IO-\IaO}{\IaO}\times\RbO - \RaO \\
   &= \result{\RoneP{0}{2}}
\end{align}

The remaining battery voltage $V - V_p$ drops across $R_2$:
\begin{align}
 R_2 &= \frac{V-V_p}{I} = \RtwoF \\
   &= \frac{\VO-(\IO-\IaO)\times\RbO}{\IO} \\
   &= \result{\RtwoP{0}{1}}
\end{align}

4. 
$R_1 = \RoneP{0}{2}$, $R_2 = \RtwoP{0}{1}$, $I_2 = \ItwoP{0}{1}$
