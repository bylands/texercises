# Resistor Circuit I: Light Bulb

1. 
\NewQty{V}{85}[\volt]
\NewQty{I}{360}[\milli\ampere]
\NewQty{Rb}{220}[\ohm]
\NewQty{VL}{30}[\volt]

\SolQty{Vp}[V-V_L]{\VX-\VLX}[\volt]
\SolQty{Itwo}[\frac{V-V_L}{R_b}]{(\VX-\VLX)/\RbX*1e3}[\milli\ampere]
\SolQty{Ione}[I-\frac{V-V_L}{R_b}]{\IX-(\VX-\VLX)/\RbX*1e3}[\milli\ampere]
\SolQty{Rone}[\frac{V-V_L}{I-\frac{V-V_L}{R_b}}]{(\VX-\VLX)/(\IX-(\VX-\VLX)/\RbX*1e3)*1e3}[\ohm]

2. 
A light bulb is connected in series with two resistors in parallel. Using the characteristic of the light bulb shown below, find the resistance $R_1$ and the currents $I_1$ and $I_2$.

\begin{center}
\begin{circuitikz}[european resistors]
 \draw (0,0) to[battery1, invert, l={\VO}] (0,3)
   to[short, i={\IO}] (1.2,3)
   to[lamp] (3,3)
   to[R, l=$R_1$, i=$I_1$] (3,0);
 \draw (3,3) -- (5,3) to[R, l={\RbO}, i=$I_2$] (5,0) -- (0,0);
\end{circuitikz}
\end{center}

\begin{center}
\begin{tikzpicture}[x=0.05cm, y=0.006cm]
 \draw[gray!30, very thin, xstep=10, ystep=40] (0,0) grid (150,800);
 \draw[gray, xstep=50, ystep=200] (0,0) grid (150,800);
 \draw (0,0) rectangle (150,800);
 \foreach \x in {0,50,100,150} \node[below, font=\small] at (\x,0) {$\x$};
 \foreach \y in {0,200,400,600,800} \node[left, font=\small] at (0,\y) {$\y$};
 \node[below] at (75,-90) {$\Delta V$ in \si{\volt}};
 \node[rotate=90, above] at (-25,400) {$I$ in \si{\milli\ampere}};
 \draw[thick, domain=2:120, samples=100, smooth] plot (\x, {360*sqrt(\x/30)});
\end{tikzpicture}
\end{center}

3. 
The diagram shows all currents (blue) and voltages (red) in the circuit.

\begin{center}
\begin{circuitikz}[european resistors, >=latex, cur/.style={blue, thick, ->}, vol/.style={red, thick, ->}]
 \draw (0,0) to[battery1, invert] (0,3) -- (1,3)
   to[lamp] (3.5,3)
   to[R, l={$R_1 = \RoneP{0}{3}$}] (3.5,0);
 \draw (3.5,3) -- (7.5,3) to[R, l={\RbO}] (7.5,0) -- (0,0);
 \draw[cur] (0.3,3) -- (0.7,3) node[midway, above] {\IO};
 \draw[cur] (3.5,0.7) -- (3.5,0.3) node[midway, right] {$I_1 = \IoneP{0}{3}$};
 \draw[cur] (7.5,0.7) -- (7.5,0.3) node[midway, right] {$I_2 = \ItwoP{0}{3}$};
 \draw[vol] (-0.4,2.25) to[bend right=35] node[midway, left] {\VO} (-0.4,0.75);
 \draw[vol] (1.55,2.55) to[bend right=35] node[midway, below] {\VLO} (2.95,2.55);
 \draw[vol] (3.1,2) to[bend right=35] node[midway, left] {\VpP{0}{2}} (3.1,1);
 \draw[vol] (7.1,2) to[bend right=35] node[midway, left] {\VpP{0}{2}} (7.1,1);
\end{circuitikz}
\end{center}

The full current $I = \IO$ flows through the light bulb. From the characteristic we read the voltage across the bulb at this current:
\begin{align}
 V_L &\approx \VLO
\end{align}

According to the voltage divider rule, the rest of the battery voltage drops across the two parallel resistors. Their common voltage is
\begin{align}
 V_p &= \VpF = \VpP{0}{2}
\end{align}

The current through $R_b = \RbO$ follows from Ohm's law:
\begin{align}
 I_2 &= \frac{V_p}{R_b} = \ItwoF \\
   &= \frac{\VO-\VLO}{\RbO} \\
   &= \result{\ItwoP{0}{3}}
\end{align}

The rest of the current flows through $R_1$:
\begin{align}
 I_1 &= I - I_2 = \IoneF \\
   &= \IO-\frac{\VO-\VLO}{\RbO} \\
   &= \result{\IoneP{0}{3}}
\end{align}

Finally,
\begin{align}
 R_1 &= \frac{V_p}{I_1} = \RoneF \\
   &= \frac{\VO-\VLO}{\IO-\frac{\VO-\VLO}{\RbO}} \\
   &= \result{\RoneP{0}{3}}
\end{align}

Because the voltage is read from a graph, results that differ slightly from these values are acceptable.

4. 
$R_1 = \RoneP{0}{3}$, $I_1 = \IoneP{0}{3}$, $I_2 = \ItwoP{0}{3}$
