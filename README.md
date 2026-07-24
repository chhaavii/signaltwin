# SignalTwin

> **See people without tracking people.**
>
> *A privacy-preserving indoor RF digital twin that optimizes wireless coverage and reconstructs crowd density using only radio signals.*

---

# Inspiration

Indoor wireless networks are typically designed through trial and error after routers have already been installed, making adjustments expensive and time-consuming. At the same time, existing occupancy sensing solutions rely on cameras or smartphone tracking, raising privacy concerns and excluding people who don't carry devices—especially in eldercare and healthcare environments.

We wanted to build a digital twin that could solve both problems simultaneously. SignalTwin simulates indoor wireless coverage while using only router-to-router radio signals to infer where people are gathered—without cameras, wearables, or phone tracking.

By combining RF propagation, device-free crowd sensing, and router optimization into a single browser-based platform, SignalTwin enables smarter building planning while preserving occupant privacy.

---

# What it does

SignalTwin is a browser-based indoor RF digital twin that simulates Wi-Fi and LoRa coverage while reconstructing live crowd density using Radio Tomographic Imaging (RTI).

The platform allows users to:

- 📡 Simulate Wi-Fi (2.4 GHz & 5 GHz) and LoRa (868/915 MHz) coverage.
- 🏠 Build realistic indoor floorplans.
- 📍 Place routers manually or automatically optimize their placement.
- 🔥 Visualize RF coverage through live heatmaps.
- 👥 Simulate realistic occupant movement using A* pathfinding.
- 📶 Reconstruct crowd density solely from changes in router-to-router RSSI.
- 🚫 Detect dead zones and weak mesh links.
- 📊 View live metrics including:
  - Coverage percentage
  - Average RSSI
  - Dead-zone area
  - Placement quality score
  - Mesh-link health
- 💾 Export simulation snapshots.

Unlike traditional occupancy systems, SignalTwin never tracks a person's position directly. Instead, it infers crowd density entirely from radio signal attenuation between routers.

---

# How we built it

SignalTwin was built as a fully client-side web application using HTML5 Canvas, Vanilla JavaScript, and CSS.

The simulation combines several computational models:

- **Friis Free-Space Path Loss** for realistic RF propagation.
- **Multi-wall attenuation** with additional non-line-of-sight penalties.
- **A* Pathfinding** for realistic occupant movement through indoor spaces.
- **Radio Tomographic Imaging (RTI)** to reconstruct crowd density from router-to-router RSSI changes.
- **Weighted Multi-Objective Greedy Optimization** for intelligent router placement.
- **Interactive dashboard** displaying coverage, crowd density, and network quality in real time.

Everything runs directly inside the browser without requiring a backend, physical routers, or additional sensors, making the project instantly deployable and easy to demonstrate.

---

# Challenges we ran into

Some of the biggest challenges included:

- Designing a realistic indoor RF propagation model that remained computationally efficient.
- Implementing Radio Tomographic Imaging using only simulated RSSI measurements rather than known occupant positions.
- Developing accurate A* pathfinding so occupants naturally navigate around walls and through doorways.
- Balancing router placement between wireless coverage and RTI reconstruction quality.
- Building a fully client-side simulation capable of running smoothly in real time.

---

# Accomplishments that we're proud of

We're proud that we were able to:

- 🔒 Build a privacy-preserving occupancy sensing system without cameras or phone tracking.
- 📡 Combine RF simulation, RTI reconstruction, pathfinding, and optimization into a single digital twin.
- 🧠 Develop a router placement algorithm that considers both coverage and sensing quality.
- ⚡ Create a complete browser-based simulation requiring zero installation or backend infrastructure.
- 🏡 Demonstrate realistic indoor scenarios suitable for smart buildings and eldercare applications.

---

# What we learned

Through SignalTwin, we learned that indoor wireless planning involves much more than maximizing signal coverage.

We explored how radio signals themselves can become sensors, enabling device-free occupancy estimation while preserving privacy.

The project also deepened our understanding of:

- RF propagation modeling
- Radio Tomographic Imaging (RTI)
- Indoor wireless networking
- A* pathfinding algorithms
- Multi-objective optimization
- Browser-based simulation
- Digital twin architecture

---

# What's next for SignalTwin

We plan to extend SignalTwin by:

- 📡 Validating simulations using real RSSI measurements from ESP32 and other wireless hardware.
- 🏢 Supporting multi-floor buildings with inter-floor attenuation.
- ❤️ Integrating with WiFi CSI-based eldercare monitoring systems.
- 📄 Generating professional RF coverage and occupancy reports.
- 📈 Providing before-and-after optimization comparisons.
- ☁️ Expanding into a cloud-connected digital twin platform for smart buildings.
- 🤖 Incorporating AI-assisted recommendations for network planning and emergency preparedness.

---

# Made with

- HTML5 Canvas
- Vanilla JavaScript
- CSS3
- RF Propagation Modeling
- Friis Free-Space Path Loss
- Radio Tomographic Imaging (RTI)
- A* Pathfinding
- Multi-Objective Greedy Optimization
- Python (Original Research Prototype)
- NumPy
- Matplotlib
