# Resistor Circuit E: Three Branches

1. 
\NewQty{V}{52}[\volt]
\NewQty{Ra}{2}[\kilo\ohm]
\NewQty{Rb}{4}[\kilo\ohm]
\NewQty{Ia}{13}[\milli\ampere]
\NewQty{Ib}{6}[\milli\ampere]
\NewQty{Ic}{14}[\milli\ampere]

\SolQty{Rone}[\frac{V}{I_a}]{\VX/\IaX}[\kilo\ohm]
\SolQty{Ione}[I_a+I_c]{\IaX+\IcX}[\milli\ampere]
\SolQty{Itwo}[I_c-I_b]{\IcX-\IbX}[\milli\ampere]
\SolQty{Vb}[I_b R_b]{\IbX*\RbX}[\volt]
\SolQty{Va}[I_c R_a]{\IcX*\RaX}[\volt]
\SolQty{Rtwo}[\frac{I_b R_b}{I_c-I_b}]{\IbX*\RbX/(\IcX-\IbX)}[\kilo\ohm]

2. 
Applying the rules for voltage and current dividers, find the resistances $R_1$ and $R_2$ and the currents $I_1$ and $I_2$ in the circuit below.

\begin{center}
\begin{circuitikz}[european resistors]
 \draw (0,0) to[battery1, invert, l={\VO}] (0,3)
   to[short, i=$I_1$] (1.5,3)
   to[R, l=$R_1$, i={\IaO}] (1.5,0);
 \draw (1.5,3) to[R, l={\RaO}] (3.5,3)
   to[R, l={\RbO}, i={\IbO}] (3.5,0);
 \draw (3.5,3) -- (5.5,3) to[R, l=$R_2$, i=$I_2$] (5.5,0)
   -- (3.5,0) to[short, i={\IcO}] (1.5,0) -- (0,0);
\end{circuitikz}
\end{center}

3. 
The diagram shows all currents (blue) and voltages (red) in the circuit.

\begin{center}
\begin{circuitikz}[european resistors, >=latex, cur/.style={blue, thick, ->}, vol/.style={red, thick, ->}]
 \draw (0,0) to[battery1, invert] (0,3) -- (2.5,3)
   to[R, l={$R_1 = \RoneP{0}{1}$}] (2.5,0);
 \draw (2.5,3) to[R, l={\RaO}] (6,3)
   to[R, l={\RbO}] (6,0);
 \draw (6,3) -- (9.5,3) to[R, l={$R_2 = \RtwoP{0}{1}$}] (9.5,0) -- (0,0);
 \draw[cur] (1.05,3) -- (1.45,3) node[midway, above] {$I_1 = \IoneP{0}{2}$};
 \draw[cur] (2.5,0.7) -- (2.5,0.3) node[midway, right] {\IaO};
 \draw[cur] (4.45,0) -- (4.05,0) node[midway, below] {\IcO};
 \draw[cur] (6,0.7) -- (6,0.3) node[midway, right] {\IbO};
 \draw[cur] (9.5,0.7) -- (9.5,0.3) node[midway, right] {$I_2 = \ItwoP{0}{1}$};
 \draw[vol] (-0.4,2.25) to[bend right=35] node[midway, left] {\VO} (-0.4,0.75);
 \draw[vol] (2.1,2.25) to[bend right=35] node[midway, left] {\VO} (2.1,0.75);
 \draw[vol] (3.55,2.65) to[bend right=35] node[midway, below] {\VaP{0}{2}} (4.95,2.65);
 \draw[vol] (5.6,2.25) to[bend right=35] node[midway, left] {\VbP{0}{2}} (5.6,0.75);
 \draw[vol] (9.1,2.25) to[bend right=35] node[midway, left] {\VbP{0}{2}} (9.1,0.75);
\end{circuitikz}
\end{center}

$R_1$ is connected directly to the battery. With the current $I_a = \IaO$ through it we find
\begin{align}
 R_1 &= \RoneF \\
   &= \frac{\VO}{\IaO} \\
   &= \result{\RoneP{0}{1}}
\end{align}

The current $I_c = \IcO$ in the bottom wire is the current through $R_a = \RaO$, i.e. the current that flows into the right part of the circuit. At the left junction the battery current splits into $I_a$ and $I_c$:
\begin{align}
 I_1 &= \IoneF \\
   &= \IaO + \IcO \\
   &= \result{\IoneP{0}{2}}
\end{align}

$I_c$ splits again into the currents through $R_b = \RbO$ and $R_2$:
\begin{align}
 I_2 &= \ItwoF \\
   &= \IcO - \IbO \\
   &= \result{\ItwoP{0}{1}}
\end{align}

$R_b$ and $R_2$ are in parallel and share the voltage $V_b = I_b R_b$. Hence
\begin{align}
 R_2 &= \frac{V_b}{I_2} = \RtwoF \\
   &= \frac{\IbO\times\RbO}{\IcO-\IbO} \\
   &= \result{\RtwoP{0}{1}}
\end{align}

Check with the voltage divider rule: the voltage across $R_a$ is $V_a = I_c R_a = \VaP{0}{2}$, and $V_b = \VbP{0}{2}$. Together they give the battery voltage, $V_a + V_b = \VO$.

4. 
$R_1 = \RoneP{0}{1}$, $R_2 = \RtwoP{0}{1}$, $I_1 = \IoneP{0}{2}$, $I_2 = \ItwoP{0}{1}$
