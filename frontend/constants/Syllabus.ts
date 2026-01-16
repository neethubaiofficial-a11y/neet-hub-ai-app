export interface Topic {
  id: string;
  name: string;
}

export interface Chapter {
  id: string;
  name: string;
  topics: Topic[];
}

export interface Subject {
  id: string;
  name: string;
  chapters: Chapter[];
}

export interface SyllabusData {
  class11: Subject[];
  class12: Subject[];
}

// Complete NEET Syllabus
export const NEETSyllabus: SyllabusData = {
  class11: [
    {
      id: 'physics-11',
      name: 'Physics',
      chapters: [
        {
          id: 'phy11-ch1',
          name: 'Physical World and Measurement',
          topics: [
            { id: 't1', name: 'Units and Dimensions' },
            { id: 't2', name: 'Dimensional Analysis' },
            { id: 't3', name: 'Significant Figures' },
            { id: 't4', name: 'Errors in Measurement' },
          ],
        },
        {
          id: 'phy11-ch2',
          name: 'Kinematics',
          topics: [
            { id: 't1', name: 'Motion in Straight Line' },
            { id: 't2', name: 'Motion in Plane' },
            { id: 't3', name: 'Projectile Motion' },
            { id: 't4', name: 'Circular Motion' },
          ],
        },
        {
          id: 'phy11-ch3',
          name: 'Laws of Motion',
          topics: [
            { id: 't1', name: "Newton's Laws" },
            { id: 't2', name: 'Friction' },
            { id: 't3', name: 'Circular Motion Dynamics' },
          ],
        },
        {
          id: 'phy11-ch4',
          name: 'Work, Energy and Power',
          topics: [
            { id: 't1', name: 'Work and Energy' },
            { id: 't2', name: 'Conservation of Energy' },
            { id: 't3', name: 'Power' },
            { id: 't4', name: 'Collisions' },
          ],
        },
        {
          id: 'phy11-ch5',
          name: 'Rotational Motion',
          topics: [
            { id: 't1', name: 'Centre of Mass' },
            { id: 't2', name: 'Torque and Angular Momentum' },
            { id: 't3', name: 'Moment of Inertia' },
          ],
        },
        {
          id: 'phy11-ch6',
          name: 'Gravitation',
          topics: [
            { id: 't1', name: "Kepler's Laws" },
            { id: 't2', name: 'Universal Law of Gravitation' },
            { id: 't3', name: 'Gravitational Potential Energy' },
            { id: 't4', name: 'Satellites' },
          ],
        },
        {
          id: 'phy11-ch7',
          name: 'Properties of Matter',
          topics: [
            { id: 't1', name: 'Elasticity' },
            { id: 't2', name: 'Surface Tension' },
            { id: 't3', name: 'Viscosity' },
            { id: 't4', name: 'Fluid Mechanics' },
          ],
        },
        {
          id: 'phy11-ch8',
          name: 'Thermodynamics',
          topics: [
            { id: 't1', name: 'Thermal Properties' },
            { id: 't2', name: 'Kinetic Theory of Gases' },
            { id: 't3', name: 'Laws of Thermodynamics' },
          ],
        },
        {
          id: 'phy11-ch9',
          name: 'Kinetic Theory of Gases',
          topics: [
            { id: 't1', name: 'Ideal Gas Equation' },
            { id: 't2', name: 'Kinetic Energy and Temperature' },
          ],
        },
        {
          id: 'phy11-ch10',
          name: 'Oscillations',
          topics: [
            { id: 't1', name: 'Simple Harmonic Motion' },
            { id: 't2', name: 'Spring and Pendulum' },
          ],
        },
        {
          id: 'phy11-ch11',
          name: 'Waves',
          topics: [
            { id: 't1', name: 'Wave Motion' },
            { id: 't2', name: 'Sound Waves' },
            { id: 't3', name: 'Doppler Effect' },
          ],
        },
      ],
    },
    {
      id: 'chemistry-11',
      name: 'Chemistry',
      chapters: [
        {
          id: 'chem11-ch1',
          name: 'Some Basic Concepts of Chemistry',
          topics: [
            { id: 't1', name: 'Mole Concept' },
            { id: 't2', name: 'Stoichiometry' },
            { id: 't3', name: 'Empirical and Molecular Formula' },
          ],
        },
        {
          id: 'chem11-ch2',
          name: 'Structure of Atom',
          topics: [
            { id: 't1', name: 'Atomic Models' },
            { id: 't2', name: 'Quantum Numbers' },
            { id: 't3', name: 'Electronic Configuration' },
          ],
        },
        {
          id: 'chem11-ch3',
          name: 'Classification of Elements',
          topics: [
            { id: 't1', name: 'Periodic Table' },
            { id: 't2', name: 'Periodic Properties' },
          ],
        },
        {
          id: 'chem11-ch4',
          name: 'Chemical Bonding',
          topics: [
            { id: 't1', name: 'Ionic and Covalent Bonds' },
            { id: 't2', name: 'VSEPR Theory' },
            { id: 't3', name: 'Hybridization' },
            { id: 't4', name: 'Molecular Orbital Theory' },
          ],
        },
        {
          id: 'chem11-ch5',
          name: 'States of Matter',
          topics: [
            { id: 't1', name: 'Gaseous State' },
            { id: 't2', name: 'Liquid State' },
            { id: 't3', name: 'Solid State' },
          ],
        },
        {
          id: 'chem11-ch6',
          name: 'Thermodynamics',
          topics: [
            { id: 't1', name: 'First Law of Thermodynamics' },
            { id: 't2', name: 'Enthalpy' },
            { id: 't3', name: 'Entropy and Free Energy' },
          ],
        },
        {
          id: 'chem11-ch7',
          name: 'Equilibrium',
          topics: [
            { id: 't1', name: 'Chemical Equilibrium' },
            { id: 't2', name: 'Ionic Equilibrium' },
            { id: 't3', name: 'Buffer Solutions' },
          ],
        },
        {
          id: 'chem11-ch8',
          name: 'Redox Reactions',
          topics: [
            { id: 't1', name: 'Oxidation and Reduction' },
            { id: 't2', name: 'Balancing Redox Reactions' },
          ],
        },
        {
          id: 'chem11-ch9',
          name: 'Hydrogen',
          topics: [
            { id: 't1', name: 'Properties of Hydrogen' },
            { id: 't2', name: 'Hydrides' },
          ],
        },
        {
          id: 'chem11-ch10',
          name: 's-Block Elements',
          topics: [
            { id: 't1', name: 'Alkali Metals' },
            { id: 't2', name: 'Alkaline Earth Metals' },
          ],
        },
        {
          id: 'chem11-ch11',
          name: 'p-Block Elements',
          topics: [
            { id: 't1', name: 'Group 13 Elements' },
            { id: 't2', name: 'Group 14 Elements' },
          ],
        },
        {
          id: 'chem11-ch12',
          name: 'Organic Chemistry - Basic Principles',
          topics: [
            { id: 't1', name: 'IUPAC Nomenclature' },
            { id: 't2', name: 'Isomerism' },
            { id: 't3', name: 'Reaction Mechanisms' },
          ],
        },
        {
          id: 'chem11-ch13',
          name: 'Hydrocarbons',
          topics: [
            { id: 't1', name: 'Alkanes, Alkenes, Alkynes' },
            { id: 't2', name: 'Aromatic Hydrocarbons' },
          ],
        },
        {
          id: 'chem11-ch14',
          name: 'Environmental Chemistry',
          topics: [
            { id: 't1', name: 'Air Pollution' },
            { id: 't2', name: 'Water Pollution' },
          ],
        },
      ],
    },
    {
      id: 'biology-11',
      name: 'Biology',
      chapters: [
        {
          id: 'bio11-ch1',
          name: 'The Living World',
          topics: [
            { id: 't1', name: 'Diversity in Living World' },
            { id: 't2', name: 'Taxonomic Categories' },
          ],
        },
        {
          id: 'bio11-ch2',
          name: 'Biological Classification',
          topics: [
            { id: 't1', name: 'Five Kingdom Classification' },
            { id: 't2', name: 'Virus, Viroids, Lichens' },
          ],
        },
        {
          id: 'bio11-ch3',
          name: 'Plant Kingdom',
          topics: [
            { id: 't1', name: 'Algae' },
            { id: 't2', name: 'Bryophytes' },
            { id: 't3', name: 'Pteridophytes' },
            { id: 't4', name: 'Gymnosperms and Angiosperms' },
          ],
        },
        {
          id: 'bio11-ch4',
          name: 'Animal Kingdom',
          topics: [
            { id: 't1', name: 'Basis of Classification' },
            { id: 't2', name: 'Invertebrates' },
            { id: 't3', name: 'Vertebrates' },
          ],
        },
        {
          id: 'bio11-ch5',
          name: 'Morphology of Flowering Plants',
          topics: [
            { id: 't1', name: 'Root, Stem, Leaf' },
            { id: 't2', name: 'Inflorescence and Flower' },
            { id: 't3', name: 'Fruit and Seed' },
          ],
        },
        {
          id: 'bio11-ch6',
          name: 'Anatomy of Flowering Plants',
          topics: [
            { id: 't1', name: 'Tissues' },
            { id: 't2', name: 'Tissue Systems' },
            { id: 't3', name: 'Secondary Growth' },
          ],
        },
        {
          id: 'bio11-ch7',
          name: 'Structural Organisation in Animals',
          topics: [
            { id: 't1', name: 'Animal Tissues' },
            { id: 't2', name: 'Organs and Organ Systems' },
          ],
        },
        {
          id: 'bio11-ch8',
          name: 'Cell: The Unit of Life',
          topics: [
            { id: 't1', name: 'Cell Theory' },
            { id: 't2', name: 'Cell Organelles' },
            { id: 't3', name: 'Cell Division' },
          ],
        },
        {
          id: 'bio11-ch9',
          name: 'Biomolecules',
          topics: [
            { id: 't1', name: 'Carbohydrates, Proteins, Lipids' },
            { id: 't2', name: 'Nucleic Acids' },
            { id: 't3', name: 'Enzymes' },
          ],
        },
        {
          id: 'bio11-ch10',
          name: 'Cell Cycle and Cell Division',
          topics: [
            { id: 't1', name: 'Mitosis' },
            { id: 't2', name: 'Meiosis' },
          ],
        },
        {
          id: 'bio11-ch11',
          name: 'Photosynthesis',
          topics: [
            { id: 't1', name: 'Light Reaction' },
            { id: 't2', name: 'Dark Reaction' },
            { id: 't3', name: 'C3 and C4 Pathway' },
          ],
        },
        {
          id: 'bio11-ch12',
          name: 'Respiration in Plants',
          topics: [
            { id: 't1', name: 'Glycolysis' },
            { id: 't2', name: 'Krebs Cycle' },
            { id: 't3', name: 'Electron Transport Chain' },
          ],
        },
        {
          id: 'bio11-ch13',
          name: 'Plant Growth and Development',
          topics: [
            { id: 't1', name: 'Growth Regulators' },
            { id: 't2', name: 'Photoperiodism' },
            { id: 't3', name: 'Vernalization' },
          ],
        },
        {
          id: 'bio11-ch14',
          name: 'Digestion and Absorption',
          topics: [
            { id: 't1', name: 'Digestive System' },
            { id: 't2', name: 'Digestion Process' },
          ],
        },
        {
          id: 'bio11-ch15',
          name: 'Breathing and Exchange of Gases',
          topics: [
            { id: 't1', name: 'Respiratory System' },
            { id: 't2', name: 'Mechanism of Breathing' },
          ],
        },
        {
          id: 'bio11-ch16',
          name: 'Body Fluids and Circulation',
          topics: [
            { id: 't1', name: 'Blood' },
            { id: 't2', name: 'Heart and Circulation' },
          ],
        },
        {
          id: 'bio11-ch17',
          name: 'Excretory Products and Elimination',
          topics: [
            { id: 't1', name: 'Human Excretory System' },
            { id: 't2', name: 'Urine Formation' },
          ],
        },
        {
          id: 'bio11-ch18',
          name: 'Locomotion and Movement',
          topics: [
            { id: 't1', name: 'Skeletal System' },
            { id: 't2', name: 'Muscular System' },
          ],
        },
        {
          id: 'bio11-ch19',
          name: 'Neural Control and Coordination',
          topics: [
            { id: 't1', name: 'Nervous System' },
            { id: 't2', name: 'Reflex Action' },
          ],
        },
        {
          id: 'bio11-ch20',
          name: 'Chemical Coordination',
          topics: [
            { id: 't1', name: 'Endocrine Glands' },
            { id: 't2', name: 'Hormones' },
          ],
        },
      ],
    },
  ],
  class12: [
    {
      id: 'physics-12',
      name: 'Physics',
      chapters: [
        {
          id: 'phy12-ch1',
          name: 'Electric Charges and Fields',
          topics: [
            { id: 't1', name: "Coulomb's Law" },
            { id: 't2', name: 'Electric Field' },
            { id: 't3', name: "Gauss's Law" },
          ],
        },
        {
          id: 'phy12-ch2',
          name: 'Electrostatic Potential',
          topics: [
            { id: 't1', name: 'Potential and Potential Difference' },
            { id: 't2', name: 'Capacitance' },
          ],
        },
        {
          id: 'phy12-ch3',
          name: 'Current Electricity',
          topics: [
            { id: 't1', name: "Ohm's Law" },
            { id: 't2', name: 'Resistances in Series and Parallel' },
            { id: 't3', name: 'Kirchhoff Laws' },
          ],
        },
        {
          id: 'phy12-ch4',
          name: 'Magnetic Effects of Current',
          topics: [
            { id: 't1', name: 'Biot-Savart Law' },
            { id: 't2', name: "Ampere's Law" },
            { id: 't3', name: 'Moving Coil Galvanometer' },
          ],
        },
        {
          id: 'phy12-ch5',
          name: 'Magnetism and Matter',
          topics: [
            { id: 't1', name: 'Bar Magnet' },
            { id: 't2', name: 'Magnetic Properties' },
          ],
        },
        {
          id: 'phy12-ch6',
          name: 'Electromagnetic Induction',
          topics: [
            { id: 't1', name: "Faraday's Laws" },
            { id: 't2', name: "Lenz's Law" },
            { id: 't3', name: 'AC Generator' },
          ],
        },
        {
          id: 'phy12-ch7',
          name: 'Alternating Current',
          topics: [
            { id: 't1', name: 'AC Circuits' },
            { id: 't2', name: 'LC Oscillations' },
            { id: 't3', name: 'Transformer' },
          ],
        },
        {
          id: 'phy12-ch8',
          name: 'Electromagnetic Waves',
          topics: [
            { id: 't1', name: 'EM Spectrum' },
            { id: 't2', name: 'Properties of EM Waves' },
          ],
        },
        {
          id: 'phy12-ch9',
          name: 'Ray Optics',
          topics: [
            { id: 't1', name: 'Reflection and Refraction' },
            { id: 't2', name: 'Mirrors and Lenses' },
            { id: 't3', name: 'Optical Instruments' },
          ],
        },
        {
          id: 'phy12-ch10',
          name: 'Wave Optics',
          topics: [
            { id: 't1', name: 'Interference' },
            { id: 't2', name: 'Diffraction' },
            { id: 't3', name: 'Polarization' },
          ],
        },
        {
          id: 'phy12-ch11',
          name: 'Dual Nature of Matter',
          topics: [
            { id: 't1', name: 'Photoelectric Effect' },
            { id: 't2', name: 'De Broglie Wavelength' },
          ],
        },
        {
          id: 'phy12-ch12',
          name: 'Atoms and Nuclei',
          topics: [
            { id: 't1', name: 'Atomic Models' },
            { id: 't2', name: 'Nuclear Physics' },
            { id: 't3', name: 'Radioactivity' },
          ],
        },
        {
          id: 'phy12-ch13',
          name: 'Semiconductor Electronics',
          topics: [
            { id: 't1', name: 'p-n Junction' },
            { id: 't2', name: 'Diode and Transistor' },
            { id: 't3', name: 'Logic Gates' },
          ],
        },
      ],
    },
    {
      id: 'chemistry-12',
      name: 'Chemistry',
      chapters: [
        {
          id: 'chem12-ch1',
          name: 'Solid State',
          topics: [
            { id: 't1', name: 'Crystal Lattice' },
            { id: 't2', name: 'Unit Cell' },
            { id: 't3', name: 'Defects in Solids' },
          ],
        },
        {
          id: 'chem12-ch2',
          name: 'Solutions',
          topics: [
            { id: 't1', name: 'Concentration Terms' },
            { id: 't2', name: 'Colligative Properties' },
          ],
        },
        {
          id: 'chem12-ch3',
          name: 'Electrochemistry',
          topics: [
            { id: 't1', name: 'Electrochemical Cells' },
            { id: 't2', name: 'Conductance' },
            { id: 't3', name: 'Electrolysis' },
          ],
        },
        {
          id: 'chem12-ch4',
          name: 'Chemical Kinetics',
          topics: [
            { id: 't1', name: 'Rate of Reaction' },
            { id: 't2', name: 'Order and Molecularity' },
          ],
        },
        {
          id: 'chem12-ch5',
          name: 'Surface Chemistry',
          topics: [
            { id: 't1', name: 'Adsorption' },
            { id: 't2', name: 'Catalysis' },
            { id: 't3', name: 'Colloids' },
          ],
        },
        {
          id: 'chem12-ch6',
          name: 'p-Block Elements',
          topics: [
            { id: 't1', name: 'Group 15-18 Elements' },
            { id: 't2', name: 'Oxides and Oxyacids' },
          ],
        },
        {
          id: 'chem12-ch7',
          name: 'd and f Block Elements',
          topics: [
            { id: 't1', name: 'Transition Metals' },
            { id: 't2', name: 'Lanthanides and Actinides' },
          ],
        },
        {
          id: 'chem12-ch8',
          name: 'Coordination Compounds',
          topics: [
            { id: 't1', name: 'Werner Theory' },
            { id: 't2', name: 'IUPAC Nomenclature' },
            { id: 't3', name: 'Crystal Field Theory' },
          ],
        },
        {
          id: 'chem12-ch9',
          name: 'Haloalkanes and Haloarenes',
          topics: [
            { id: 't1', name: 'Nomenclature and Reactions' },
            { id: 't2', name: 'Substitution Reactions' },
          ],
        },
        {
          id: 'chem12-ch10',
          name: 'Alcohols, Phenols and Ethers',
          topics: [
            { id: 't1', name: 'Preparation and Properties' },
            { id: 't2', name: 'Reactions' },
          ],
        },
        {
          id: 'chem12-ch11',
          name: 'Aldehydes, Ketones and Carboxylic Acids',
          topics: [
            { id: 't1', name: 'Carbonyl Compounds' },
            { id: 't2', name: 'Reactions and Mechanisms' },
          ],
        },
        {
          id: 'chem12-ch12',
          name: 'Amines',
          topics: [
            { id: 't1', name: 'Classification and Nomenclature' },
            { id: 't2', name: 'Reactions' },
          ],
        },
        {
          id: 'chem12-ch13',
          name: 'Biomolecules',
          topics: [
            { id: 't1', name: 'Carbohydrates and Proteins' },
            { id: 't2', name: 'Nucleic Acids' },
            { id: 't3', name: 'Vitamins' },
          ],
        },
        {
          id: 'chem12-ch14',
          name: 'Polymers',
          topics: [
            { id: 't1', name: 'Types of Polymers' },
            { id: 't2', name: 'Polymerization' },
          ],
        },
      ],
    },
    {
      id: 'biology-12',
      name: 'Biology',
      chapters: [
        {
          id: 'bio12-ch1',
          name: 'Reproduction in Organisms',
          topics: [
            { id: 't1', name: 'Asexual Reproduction' },
            { id: 't2', name: 'Sexual Reproduction' },
          ],
        },
        {
          id: 'bio12-ch2',
          name: 'Sexual Reproduction in Flowering Plants',
          topics: [
            { id: 't1', name: 'Structure of Flower' },
            { id: 't2', name: 'Pollination' },
            { id: 't3', name: 'Fertilization' },
          ],
        },
        {
          id: 'bio12-ch3',
          name: 'Human Reproduction',
          topics: [
            { id: 't1', name: 'Male and Female Reproductive Systems' },
            { id: 't2', name: 'Menstrual Cycle' },
            { id: 't3', name: 'Pregnancy and Embryo Development' },
          ],
        },
        {
          id: 'bio12-ch4',
          name: 'Reproductive Health',
          topics: [
            { id: 't1', name: 'Population Control' },
            { id: 't2', name: 'Contraceptive Methods' },
            { id: 't3', name: 'STDs' },
          ],
        },
        {
          id: 'bio12-ch5',
          name: 'Principles of Inheritance',
          topics: [
            { id: 't1', name: "Mendel's Laws" },
            { id: 't2', name: 'Chromosomal Theory' },
            { id: 't3', name: 'Sex Determination' },
          ],
        },
        {
          id: 'bio12-ch6',
          name: 'Molecular Basis of Inheritance',
          topics: [
            { id: 't1', name: 'DNA Structure' },
            { id: 't2', name: 'DNA Replication' },
            { id: 't3', name: 'Transcription and Translation' },
            { id: 't4', name: 'Genetic Code' },
          ],
        },
        {
          id: 'bio12-ch7',
          name: 'Evolution',
          topics: [
            { id: 't1', name: 'Origin of Life' },
            { id: 't2', name: "Darwin's Theory" },
            { id: 't3', name: 'Evidence of Evolution' },
          ],
        },
        {
          id: 'bio12-ch8',
          name: 'Human Health and Disease',
          topics: [
            { id: 't1', name: 'Common Diseases' },
            { id: 't2', name: 'Immunity' },
            { id: 't3', name: 'Vaccines' },
          ],
        },
        {
          id: 'bio12-ch9',
          name: 'Strategies for Food Production',
          topics: [
            { id: 't1', name: 'Animal Husbandry' },
            { id: 't2', name: 'Plant Breeding' },
          ],
        },
        {
          id: 'bio12-ch10',
          name: 'Microbes in Human Welfare',
          topics: [
            { id: 't1', name: 'Microbes in Household Products' },
            { id: 't2', name: 'Industrial Applications' },
          ],
        },
        {
          id: 'bio12-ch11',
          name: 'Biotechnology Principles',
          topics: [
            { id: 't1', name: 'Genetic Engineering' },
            { id: 't2', name: 'Recombinant DNA Technology' },
          ],
        },
        {
          id: 'bio12-ch12',
          name: 'Biotechnology Applications',
          topics: [
            { id: 't1', name: 'Medical Applications' },
            { id: 't2', name: 'Agricultural Applications' },
          ],
        },
        {
          id: 'bio12-ch13',
          name: 'Organisms and Populations',
          topics: [
            { id: 't1', name: 'Population Ecology' },
            { id: 't2', name: 'Population Interactions' },
          ],
        },
        {
          id: 'bio12-ch14',
          name: 'Ecosystem',
          topics: [
            { id: 't1', name: 'Energy Flow' },
            { id: 't2', name: 'Nutrient Cycling' },
            { id: 't3', name: 'Ecological Succession' },
          ],
        },
        {
          id: 'bio12-ch15',
          name: 'Biodiversity and Conservation',
          topics: [
            { id: 't1', name: 'Biodiversity' },
            { id: 't2', name: 'Conservation Strategies' },
          ],
        },
        {
          id: 'bio12-ch16',
          name: 'Environmental Issues',
          topics: [
            { id: 't1', name: 'Pollution' },
            { id: 't2', name: 'Global Warming' },
            { id: 't3', name: 'Ozone Depletion' },
          ],
        },
      ],
    },
  ],
};