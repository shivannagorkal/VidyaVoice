import { useState } from "react";

const EDUCATION_LEVELS = [
  {
    group: "School",
    icon: "🏫",
    options: [
      { value: "class1-5",  label: "Class 1 – 5",   desc: "Primary School" },
      { value: "class6-8",  label: "Class 6 – 8",   desc: "Middle School" },
      { value: "class9-10", label: "Class 9 – 10",  desc: "High School (SSLC)" },
    ],
  },
  {
    group: "Pre-University (PUC / 11-12)",
    icon: "📘",
    options: [
      { value: "puc-science",  label: "PUC Science",   desc: "Physics, Chemistry, Maths/Bio" },
      { value: "puc-commerce", label: "PUC Commerce",  desc: "Accounts, Business Studies" },
      { value: "puc-arts",     label: "PUC Arts",      desc: "History, Political Science, etc." },
    ],
  },
  {
    group: "Degree / Undergraduate",
    icon: "🎓",
    options: [
      { value: "eng-cse",    label: "Engineering – CSE / IT",    desc: "Computer Science & IT" },
      { value: "eng-mech",   label: "Engineering – Mechanical",  desc: "Mech, Auto, Production" },
      { value: "eng-civil",  label: "Engineering – Civil",       desc: "Civil & Structural" },
      { value: "eng-eee",    label: "Engineering – EEE / ECE",   desc: "Electronics & Electrical" },
      { value: "mbbs",       label: "Medical (MBBS / BDS)",      desc: "Anatomy, Physiology, etc." },
      { value: "bsc",        label: "B.Sc (Science)",            desc: "Physics, Chemistry, Bio, Maths" },
      { value: "bcom",       label: "B.Com / BBA",               desc: "Commerce & Management" },
      { value: "ba",         label: "B.A (Arts / Humanities)",   desc: "History, Sociology, etc." },
      { value: "agriculture",label: "Agriculture (B.Sc Ag)",     desc: "Agronomy, Soil Science, Horticulture" },
    ],
  },
];

const SUBJECTS_BY_LEVEL = {
  "class1-5":     ["Maths", "English", "EVS", "Hindi", "General Knowledge"],
  "class6-8":     ["Maths", "Science", "Social Studies", "English", "Hindi"],
  "class9-10":    ["Maths", "Science", "Social Science", "English", "Sanskrit/Hindi"],
  "puc-science":  ["Physics", "Chemistry", "Mathematics", "Biology", "Computer Science"],
  "puc-commerce": ["Accountancy", "Business Studies", "Economics", "Maths", "English"],
  "puc-arts":     ["History", "Political Science", "Economics", "Sociology", "English"],
  "eng-cse":      ["Data Structures", "Algorithms", "DBMS", "OS", "Computer Networks", "OOP", "Web Dev", "AI/ML"],
  "eng-mech":     ["Engineering Mechanics", "Thermodynamics", "Fluid Mechanics", "Manufacturing", "CAD/CAM"],
  "eng-civil":    ["Structural Analysis", "Fluid Mechanics", "Surveying", "Concrete Technology", "Geotechnics"],
  "eng-eee":      ["Circuit Theory", "Electronics", "Signals & Systems", "Power Systems", "Control Systems"],
  "mbbs":         ["Anatomy", "Physiology", "Biochemistry", "Pathology", "Pharmacology", "Microbiology"],
  "bsc":          ["Physics", "Chemistry", "Mathematics", "Biology", "Statistics"],
  "bcom":         ["Financial Accounting", "Business Law", "Economics", "Management", "Statistics"],
  "ba":           ["History", "Sociology", "Political Science", "Psychology", "Philosophy"],
  "agriculture":  ["Agronomy", "Soil Science", "Horticulture", "Plant Pathology", "Agricultural Economics", "Entomology", "Genetics & Plant Breeding", "Farm Machinery", "Irrigation & Water Management", "Animal Husbandry"],
};

const MODES = [
  { value: "explain", icon: "📖", label: "Explain Concepts",  desc: "Get clear explanations of any topic" },
  { value: "qa",      icon: "💬", label: "Ask Questions",     desc: "Ask anything, get detailed answers" },
  { value: "doubt",   icon: "🤔", label: "Clarify Doubts",    desc: "Clear your specific confusions" },
  { value: "quiz",    icon: "🧪", label: "Take a Quiz",       desc: "MCQ questions with answers" },
  { value: "notes",   icon: "📝", label: "Quick Notes",       desc: "Get summary notes on any topic" },
];

export default function Onboarding({ onComplete, initialStep, initialLevel, initialSubject }) {
  const [step, setStep]       = useState(initialStep || 1);
  const [level, setLevel]     = useState(initialLevel || null);
  const [subject, setSubject] = useState(initialSubject || null);

  function pickLevel(val) {
    setLevel(val);
    setStep(2);
  }

  function pickSubject(val) {
    setSubject(val);
    setStep(3);
  }

  function pickMode(val) {
    const levelLabel = EDUCATION_LEVELS.flatMap(g => g.options).find(o => o.value === level)?.label || level;
    onComplete({ level, levelLabel, subject, mode: val });
  }

  return (
    <div className="onboarding">
      <div className="ob-progress">
        {[1, 2, 3].map(s => (
          <div key={s} className={`ob-dot ${step >= s ? "active" : ""} ${step > s ? "done" : ""}`}>
            {step > s ? "✓" : s}
          </div>
        ))}
      </div>

      {step === 1 && (
        <div className="ob-step">
          <h2 className="ob-title">What's your education level?</h2>
          <p className="ob-sub">Choose your current class or degree</p>
          <div className="ob-groups">
            {EDUCATION_LEVELS.map(group => (
              <div key={group.group} className="ob-group">
                <div className="ob-group-label">{group.icon} {group.group}</div>
                <div className="ob-options">
                  {group.options.map(opt => (
                    <button key={opt.value} className="ob-card" onClick={() => pickLevel(opt.value)}>
                      <span className="ob-card-title">{opt.label}</span>
                      <span className="ob-card-desc">{opt.desc}</span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="ob-step">
          <button className="ob-back" onClick={() => setStep(1)}>← Back</button>
          <h2 className="ob-title">Choose your subject</h2>
          <p className="ob-sub">What do you want to study today?</p>
          <div className="ob-subject-grid">
            {(SUBJECTS_BY_LEVEL[level] || []).map(sub => (
              <button key={sub} className="ob-subject-btn" onClick={() => pickSubject(sub)}>
                {sub}
              </button>
            ))}
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="ob-step">
          <button className="ob-back" onClick={() => setStep(2)}>← Back</button>
          <h2 className="ob-title">How do you want to learn?</h2>
          <p className="ob-sub">Choose your study mode for <strong>{subject}</strong></p>
          <div className="ob-modes">
            {MODES.map(m => (
              <button key={m.value} className="ob-mode-card" onClick={() => pickMode(m.value)}>
                <span className="ob-mode-icon">{m.icon}</span>
                <span className="ob-mode-label">{m.label}</span>
                <span className="ob-mode-desc">{m.desc}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}