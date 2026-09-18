Shorthand: write quantities where they belong

Type a quantity in angle brackets, right in the sentence. On preview and save it becomes the solver LaTeX on the right (the <…> button shows the expansion in the editors first).

A body of <m = 25 t> falls	defines m (25 t, converted to kg) and prints \mO, i.e. "25 t", in the sentence
<v = 115 km/h>	km/h, mW, g/cm^3, min, h, kWh, eV, bar, l, u, ° and °C are understood; prefixes as usual
<mPy (m_0) = 36 g>	the symbol in parentheses is what formulas and boxes show; greek without backslash: (rho_2), (Delta T)
<h = v^2/(2 g)>	computes h: names without X, juxtaposition multiplies, unit derived automatically. In the solution this also writes the block h = \hF, = numbers, = \h; in the preamble only the definition. \hF is the formula in terms of the given quantities: for <P = E/t> with a computed E the first line reads P = \frac{E}{t} = \frac{\EF}{t} = \PF, the numbers line uses \E
<h = m g h = 1/2 m v^2>	an equation is solved for h first (two roots: the positive one)
<E = 1/2 m v^2>[kJ]	result in a unit of your choice
<gegeben> / <given>	the box listing every given quantity so far
<gesucht h Höhe> / <wanted …>	the box naming the unknown, with its unit
<lösung h 2> / <solution …>	the result box, 2 significant figures; <lösung h 2: v^2/(2 g)> shows that formula instead of the substituted chain
Constants by their letter: g c h hbar e k kB R NA eps muo me mp mn u sigma po (unless you define the name yourself). Functions: sqrt sin cos tan asin acos atan exp ln log abs, pi. Angles given in ° are fed to sin/cos/tan as degrees. A quantity in °C is left as typed; <TK = T + 273.15> converts. Names are letters only and must not be LaTeX commands (write <al (alpha) = 30 °>, not alpha).

Example. Text:
A stone of <m = 2.0 kg> is thrown up at <v = 54 km/h>. How high does it rise?
Solution:
<gegeben> <gesucht h height>
<h = m g h = 1/2 m v^2>
<lösung h 2>
becomes \NewQty{m}{2.0}[\kilo\gram], \NewQty*{v}{54}[\kilo\meter\per\hour][1e3/3600][\meter\per\second], \SolQty{h}[\frac{v^{2}}{2 g}]{\vX^2/(2*\ncgX)}[\meter] in the preamble, \mO/\vO in the text, and the three boxes plus the align block in the solution.

The solver LaTeX this expands to

\NewQty{P}{13.4}[\milli\watt][e-3][\watt] defines a given quantity: \PO as given (13.4 mW), \P in SI (13.4·10-3 W), \PX the SI number, \PU the unit. \NewQty*{v}{54}[\kmph][1/3.6][\mps] converts with a factor instead of a power of ten.

\SolQty{h}[\frac{v^2}{2g}]{\vX^2/(2*\ncgX)}[\meter] computes a quantity (xfp arithmetic on the X numbers): \h (4 significant figures, scientific), \hS{2} (2 figures), \hP{3}{2} (prefix 103, 2 figures: "… km"), \hQ (plain, 4 figures), \hI (integer), \hF (the formula), \hX, \hU. \ConvTo{mt}{1e-3}{m}{t} converts an existing quantity.

Boxes: \Geg{m &= \mO = \m\ v &= \vO = \v}, \Ges{height}{[h]=\si{\meter}}, \Lsg{h &= \frac{v^2}{2g}\ &= \hS{2}}.

Predefined quantities: \ncg (g), \ncG (gravitation), \ncme \ncmp \ncmn (electron, proton, neutron mass), \nce (charge), \nceps \ncmuo (field constants), \ncNA (Avogadro), \ncc (speed of light), \nch \nchbar (Planck), \ncu (atomic mass unit), \ncpo (normal pressure), \nck (Boltzmann), \ncR (gas constant), \ncS (Stefan-Boltzmann), \ncb (Wien), \ncJS (solar constant); \MSun \MMoo \MMer \MVen \MEar \MMar \MJup \MSat \MUra \MNep \MPlu and \rSun … \rPlu (masses, radii). \ncgX is the bare number. \Waerme{Liste} lists the substances with thermal values (\cXX \LfXX \LvXX \TfXX \TvXX \eXX \pXX \lXX \UXX).

Unit shortcuts: \mps \cmps \kmps \kmph \mpss \mpsq \cmpsq \kmpsq \Npkg \Nmqpkgq \mkpkgsq \radps \radpsq \radqpsq \rpss \rps \Npm \Npcm \Npmm \kgmps \kgpmk \kgpcm \gpcmk \Wpqmkv \Wpmq \mTps \CpVm … and more of the same pattern.

Package:  siunitx typesets the quantities.
Package:  xfp does the arithmetic (sin(), sqrt(), pi, ^).
