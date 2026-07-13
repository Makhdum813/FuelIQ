# FuelIQ — E20 Fuel Economics Analytics

**Live app:** https://fueliq-app.netlify.app/

An offline-first web application that quantifies the real financial impact of India's E20 petrol
transition for individual vehicle owners — mileage loss, extra cost per kilometre, monthly and
annual impact, multi-year ownership projections, and professional reports.

Built solo, end to end, with **vanilla HTML, CSS and JavaScript**. No frameworks, no build tools,
no dependencies, no backend.

---

## Author

**Makhdumhusain Kodkeri**
AI/ML Data Annotation Specialist · Aspiring Data Analyst

- GitHub: https://github.com/Makhdum813
- LinkedIn: https://www.linkedin.com/in/makhdumhusain-kodkeri-655800305
- Email: makhdum87@gmail.com

---

## Licence and attribution

Copyright © 2026 Makhdumhusain Kodkeri.

This project is released under the **[MIT Licence](LICENSE)**.

You are free to use, copy, modify, merge, publish, distribute, sublicense and sell copies of this
software — including for commercial purposes — **provided that the copyright notice and the licence
text are retained in all copies or substantial portions of the software.**

In plain terms: **reuse is welcome, but you must credit the original author.** Removing the
copyright notice and presenting this work as your own is a breach of the licence.

If you build something on top of FuelIQ, I'd genuinely like to hear about it.

---

## Features

- **E20 impact calculator** — mileage loss, cost per km, monthly and yearly impact
- **Vehicle profiles** — save cars, bikes and scooters with their real mileage
- **Fuel & mileage log** — track true measured mileage from actual fill-ups
- **Smart insights** — rule-based, plain-language explanations of every result
- **Vehicle and fuel-blend comparison** — E0 / E10 / E20 / E85 on an energy-density model
- **Budget and trip planners**
- **Ownership dashboard** — 1, 3 and 5-year cost projections
- **CO₂ estimator** — tailpipe emissions before vs after
- **PDF and CSV report export**
- **Light and dark themes**
- **Full offline support** — installable PWA via service worker

---

## Architecture

```
index.html          Landing page
assets/             Landing page images
app/
  index.html        Application shell (13 tabs)
  app.js            Application controller
  styles.css        Design system and all styling
  sw.js             Service worker (offline support)
  manifest.json     PWA manifest
  modules/          Feature modules (calculator, vehicles, fuel log, insights, …)
  utils/            Formatting, CSV export, share links
  storage/          localStorage persistence layer
```

All computation runs client-side. There is no backend, no login and no telemetry beyond
page-level analytics. Vehicle data, fuel logs and calculation history are stored exclusively in the
user's own browser via `localStorage` and never leave the device.

---

## Running locally

No build step. Clone the repository and open `index.html` in a browser — that's it.

```bash
git clone https://github.com/Makhdum813/FuelIQ.git
cd FuelIQ
# then open index.html
```

---

## Data sources

Efficiency-drop figures are grounded in published data, not guesswork:

- **NITI Aayog & Ministry of Petroleum and Natural Gas** — *Roadmap for Ethanol Blending in India 2020–25*
- **ARAI** — E20 fuel efficiency fleet testing (2–6% mileage loss across a mixed-age fleet)
- **IEA Advanced Motor Fuels programme** — ethanol and gasoline energy-content data
- **US Department of Energy, Alternative Fuels Data Center** — fuel property comparisons

---

## Disclaimer

FuelIQ produces **estimates for informational and educational purposes only.** Real-world fuel
economy depends on vehicle condition, driving style, load, terrain and traffic. Figures shown are
not a guarantee of actual savings or costs, and nothing in this project constitutes financial,
mechanical or professional advice.

"FuelIQ" is used here as the name of an independent personal project and is not affiliated with,
endorsed by, or connected to any other company, product or registered trade mark of a similar name.
