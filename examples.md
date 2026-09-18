# Drift Velocity

1. 
\NewQty{nCu}{11.6e28}[\m^{-3}]
\NewQty{nAg}{6.9e28}[\m^{-3}]

\SolQty{ratio}[\sqrt{\frac{\ssc{n}{Ag}}{\ssc{n}{Cu}}}]{sqrt(\nAgX/\nCuX)}

2. 
The drift velocity in a copper and a silver wire is the same if the currents are the same. Calculate the ratio of the two wires' diameters.

3. 
Since the drift velocities and the currents are the same, we have
\begin{align}
 \frac{I}{v} = \ssc{n}{Cu}\cdot\ssc{A}{Cu} &= \ssc{n}{Ag}\cdot\ssc{A}{Ag} \\
 \ssc{n}{Cu}\cdot\left(\ssc{d}{Cu}\right)^2 &= \ssc{n}{Ag}\cdot\left(\ssc{d}{Ag}\right)^2
\end{align}

The ratio of the diameters is therefore
\begin{align}
 \frac{\ssc{d}{Cu}}{\ssc{d}{Ag}} &= \ratioF \\
   &= \sqrt{\frac{\nAg}{\nCu}}\\
   &= \ratio \approx \result{\ratioP{0}{2}}
\end{align}

4. 
$\ratioP{0}{2}$


# Rectangular Coil

1. 
\NewQty{L}{3.0}[\cm][e-2][\m]
\NewQty{W}{1.0}[\cm][e-2][\m]
\NewQty{v}{2.0}[\mps]
\NewQty{B}{0.5}[\T]

\SolQty{Va}[-B\cdot L\cdot v]{-\BX*\LX*\vX}[\V]
\SolQty{ta}[\frac{W}{v}]{\WX/\vX}[\s]

\SolQty{Vb}[-B\cdot W\cdot v]{-\BX*\WX*\vX}[\V]
\SolQty{tb}[\frac{L}{v}]{\LX/\vX}[\s]

2. 
A rectangular coil with sides \LO\ and \WO\ is pushed into a homogeneous magnetic field with strength \BO. The velocity vector has a magnitude \vO. The area of the coil is perpendicular to the magnetic field lines.

\begin{abcliste}
\abc 
For the two orientations shown in the figure below make a quantitative graph for the induced emf vs. time.

\abc 
Discuss the properties of the induced emf for other orientations of the coil (still perpendicular to the magnetic field).
\end{abcliste}

\begin{center}
\includegraphics[width=\textwidth]{#image_path:rectangular-coil#}
\end{center}

3. 
\begin{abcliste}
\abc 
While the coil is entering the magnetic field, the induced emf is
\begin{align}
 \mathcal{E}(t) &= -\dot\Phi_m(t) \\
   &= -B\cdot \dot{A}(t) \\
   &= -B\cdot y\cdot\dot x(t)
\end{align}
where $y$ is the vertical dimension of the coil and $x(t)$ is the distance by which the coil has already entered the field.

\medskip
In the first situation we find
\begin{align}
 \mathcal{E}(t) &= \Va \\
   &= -\B\times\L\times\v\\
   &= \Va \approx \result{\VaP{-3}{2}}
\end{align}

The time for the coil to enter the magnetic field is given by
\begin{align}
 \Delta t &= \taF \\
   &= \frac{\W}{\v}\\
   &= \ta \approx{\taP{-3}{2}}
\end{align}

For the second situation the same calculations apply with the roles of width and length switched. We find a voltage of $\VbP{-3}{2}$ during a time of $\tbP{-3}{2}$.

\begin{center}
\includegraphics[width=8cm]{#image_path:rectangular-coil-2#}
\end{center}

\abc 
For an arbitrary angle there are three different phases:
\begin{itemize}
\item Phase I: The area in the field as a function of the horizontal position is given by a quadratic function (area of a triangle with a linearly increasing height). This corresponds to a linear rate of change of the area in the field and therefore to a linear increase of the induced emf.
\item Phase II: Between the positions A and B in the figure below the area increases at a constant rate. This is equivalent to a constant induced emf.
\item Phase III: The area decreases in the same way that it increases in phase I. As a consequence the induced emf decreases linearly.
\end{itemize}
\end{abcliste}

\begin{center}
\includegraphics[width=37.3mm]{#image_path:rectangular-coil-rotated-1#}
\end{center}

For a coil rotated by an angle $\alpha$ (with respect to the first situation in (a), the times at which the different phases start (and end) are given by
\begin{equation}
t_1=\frac{W\cdot\cos\alpha}{v}
\end{equation}

\begin{equation}
t_2=\frac{L\cdot\sin\alpha}{v}
\end{equation}

\begin{equation}
t_3=t_1+t_2=\frac{W\cdot\cos\alpha}{v}+\frac{L\cdot\sin\alpha}{v}
\end{equation}

The area in the magnetic field can be expessed as follows:
\begin{equation}
 A(t) = \begin{cases}
 \frac{v^2}{2\cdot\sin\alpha\cdot\cos\alpha}\cdot t^2 & 0\leq t\leq t_1 \\
 \frac{W^2}{\tan\alpha}+\frac{v\cdot W}{\sin\alpha}\cdot(t-t_1) & t_1\leq t\leq t_2 \\
 L\cdot W-\frac{v^2}{2\cdot\sin\alpha\cdot\cos\alpha}\cdot (t_3-t)^2 & t_2\leq t\leq t_3
\end{cases}
\end{equation}

The induced emf then follows from Faraday's law:
\begin{equation}
\mathcal{E}=-B\dot A(t)=\begin{cases}
-B\cdot\frac{v^2}{\sin\alpha\cdot\cos\alpha}\cdot t  & 0\leq t\leq t_1 \\
-B\cdot\frac{v\cdot W}{\sin\alpha} & t_1\leq t\leq t_2 \\
-B\cdot\frac{v\cdot W}{\sin\alpha}-\frac{v^2}{\sin\alhpa\cdot\cos\alpha}\cdot t & t_2\leq t\leq t_3
\end{cases}
\end{equation}

The corresponding graph for $\alpha=\SI{30}{\degree}$ has been included in the diagram below. The area between the red graph and the time axis is
\begin{align}
 -\Delta\Phi &= -B\cdot\frac{v\cdot W}{\sin\alpha}\cdot t_2 \\
   &= -B\cdot\frac{v\cdot W}{\sin\alpha}\cdot \frac{L\cdot\sin\alpha}{v}\\
   &= -B\cdot L\cdot W\\
\end{align}
which corresponds once again to the total (negative) flux change during this process.

\begin{center}
\includegraphics[width=8cm]{#image_path:rectangular-coil-rotated#}
\end{center}

4. 
(a) $\VaP{-3}{2}$, $\taP{-3}{2}$, $\VbP{-3}{2}$, $\tbP{-3}{2}$


# High Pass Filter

1. 
\NewQty{V}{120}[\milli\V]
\NewQty{R}{330}[\ohm]
\NewQty{L}{47}[\milli\H][e-3][\F]
\NewQty{VL}{45}[\milli\V]

\SolQty{omc}[\frac{R}{L}]{\RX/\LX)}[\radian\per\s]
\ConvTo{fc}{1/(2*pi)}{omc}{\Hz}

\SolQty{f}[\frac{R}{2\pi L \sqrt{\left(\frac{V_0}{V_L}\right)^2-1}}]{\RX/(2*pi*\LX*sqrt((\VX/\VLX)^2-1))}[\Hz]

2. 
A simple \emph{high pass} filter consists of a resistor and an inductor connected in series to the input signal.

\begin{abcliste}
\abc 
Show that the partial voltage (amplitude) across the inductor is given by
\begin{align}
 V_C &= \frac{V_0}{\sqrt{\left(\frac{\omega_c}{\omega}\right)^2 + 1}}
\end{align}
where $V_0$ is the amplitude of the input signal and $\omega_c$ the \emph{cutoff frequency}:
\begin{align}
 \omega_c &= \sqrt{\frac{R}{L}}
\end{align}

What is the partial voltage at the cutoff frequency? Sketch the value of $V_L/V_0$ vs frequency.

\abc 
For a typical high pass filter used in audio circuits, the input signal has an amplitude of \VO, and the resistance and inductance are \RO\ and \LO, respectively. Calculate the cutoff frequency and the frequency at which the output voltage (i.e. the partial voltage across the inductor) is \VLO.
\end{abcliste}

3. 
\begin{abcliste}
\abc 
The impedance for an RL series circuit is
\begin{align}
 Z &= \sqrt{R^2+\left(\omega L\right)^2}
\end{align}
It follows for the partial voltage across the capacitor
\begin{align}
 V_L &= X_L I_0 = \omega L\cdot \frac{V_0}{Z} \\
   &= \frac{V_0 \omega L}{\sqrt{R^2+\left(\omega L\right)^2}}\\
   &= \frac{V_0}{\sqrt{\left(\frac{R}{\omega L\right)^2+1}}}
\end{align}
With
\begin{align}
 \frac{R}{L} &= \omega_c
\end{align}
it follows
\begin{align}
 V_L &= \frac{V_0}{\left(\frac{\omega_c}{\omega}\right)^2+1} \quad \square
\end{align}

For $\omega=\omega_c$ we find
\begin{align}
 V_L &= \frac{V_0}{\sqrt{\left(\frac{\omega_c}{\omega_c}\right)^2+1}} \\
   &= \frac{V_0}{\sqrt{2}}
\end{align}
i.e. the voltage across the inductor is $\sqrt{2}$ times smaller than the input voltage.

\vspace{5mm}

The diagram below shows how the partial voltage depends on the frequency.

\begin{center}
\includegraphics[width=\textwidth]{#image_path:high-pass-filter-1#}
\end{center}

\abc 
The cutoff (angular) frequency is
\begin{align}
 \omega_c &= \omcF \\
   &= \frac{\R}{\L}\\
   &= \omc
\end{align}

This corresponds to a frequency 
\begin{align}
 f_c &= \frac{\omega_c}{2\pi} = \fc \approx \result{\fcP{3}{2}}
\end{align}

The partial voltage across the inductor is
\begin{align}
 V_L &= \frac{V_0}{\sqrt{\left(\frac{\omega_c}{\omega}\right)^2+1}} = \frac{V_0}{\sqrt{\left(\frac{R}{2\pi f \cdot L}\right)^2+1}}
\end{align}

Solving for the frequency yields
\begin{align}
 f &= \fF \\
   &= \frac{\R}{2\pi\times\L\times\sqrt{\left(\frac{\V}{\VL}\right)^2-1}}\\
   &= \f \approx \result{\fP{0}{2}}
\end{align}


\end{abcliste}

4. 
(a) $V_0/\sqrt{2}$, (b) $\fcP{3}{2}$, $\fP{0}{2}$
