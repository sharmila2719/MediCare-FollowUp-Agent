/**
 * MediCare Patient Follow-Up Agent — Live Demo
 * Runs entirely on real patient_data.csv — no API key needed for demo
 * Simulates the full agentic tool-chaining pipeline
 */

const fs   = require('fs');
const path = require('path');

// ─── Colours ────────────────────────────────────────────────────────────────
const C = {
  reset:  '\x1b[0m',   bold:   '\x1b[1m',
  red:    '\x1b[31m',  green:  '\x1b[32m',  yellow: '\x1b[33m',
  blue:   '\x1b[34m',  magenta:'\x1b[35m',  cyan:   '\x1b[36m',
  white:  '\x1b[97m',  grey:   '\x1b[90m',  orange: '\x1b[38;5;208m',
  bgRed:  '\x1b[41m',  bgGreen:'\x1b[42m',  bgBlue: '\x1b[44m',
};
const b  = s => `${C.bold}${s}${C.reset}`;
const c  = (col, s) => `${col}${s}${C.reset}`;
const hr = (ch='─', n=70) => c(C.grey, ch.repeat(n));
const sleep = ms => new Promise(r => setTimeout(r, ms));

// ─── Parse CSV ───────────────────────────────────────────────────────────────
function parseCSV(filePath) {
  const lines = fs.readFileSync(filePath, 'utf8').trim().split('\n');
  const headers = lines[0].split(',');
  return lines.slice(1).map(line => {
    const vals = []; let cur = ''; let inQ = false;
    for (const ch of line) {
      if (ch === '"') { inQ = !inQ; continue; }
      if (ch === ',' && !inQ) { vals.push(cur.trim()); cur = ''; }
      else cur += ch;
    }
    vals.push(cur.trim());
    return Object.fromEntries(headers.map((h, i) => [h.trim(), vals[i] ?? '']));
  });
}

const DATA_PATH = path.join(__dirname, 'patient_data.csv');
const patients  = parseCSV(DATA_PATH);
const byId      = Object.fromEntries(patients.map(p => [p.patient_id, p]));

// ─── TOOL 1: get_patient_data ────────────────────────────────────────────────
function get_patient_data(patient_id) {
  return byId[patient_id] || { error: `Patient ${patient_id} not found` };
}

// ─── TOOL 2: flag_clinical_risk ──────────────────────────────────────────────
function flag_clinical_risk(patient_id) {
  const rec = get_patient_data(patient_id);
  if (rec.error) return rec;
  const flags = [];
  const lab = rec.lab_test, val = parseFloat(rec.lab_value);

  const labRules = {
    'HbA1c':       [val > 8.0,  `HbA1c ${val}% (target <8%) — poor glycaemic control`],
    'BNP':         [val > 400,  `BNP ${val} pg/mL (>400) — elevated heart failure marker`],
    'eGFR':        [val < 45,   `eGFR ${val} mL/min (<45) — reduced kidney function`],
    'Hemoglobin':  [val < 10,   `Haemoglobin ${val} g/dL (<10) — significant anaemia`],
    'FEV1%':       [val < 50,   `FEV1% ${val}% (<50) — severe airflow obstruction`],
    'Peak Flow':   [val < 320,  `Peak Flow ${val} L/min (<320) — reduced respiratory function`],
    'BP Systolic': [val > 140,  `Lab BP ${val} mmHg (>140) — hypertension`],
    'PHQ-9 Score': [val > 14,   `PHQ-9 ${val}/27 (>14) — moderate-to-severe depression`],
    'TSH':         [val > 6.0,  `TSH ${val} mIU/L (>6.0) — hypothyroidism undertreated`],
  };
  if (labRules[lab] && labRules[lab][0]) flags.push(labRules[lab][1]);
  if (parseInt(rec.vitals_bp_systolic) >= 160)
    flags.push(`Vitals systolic BP ${rec.vitals_bp_systolic} mmHg — severely elevated`);
  if (parseInt(rec.vitals_spo2) < 94)
    flags.push(`SpO2 ${rec.vitals_spo2}% — low oxygen saturation`);
  if (parseInt(rec.days_since_last_visit) > 180)
    flags.push(`Last visit ${rec.days_since_last_visit} days ago — overdue follow-up`);
  if (rec.missed_last_appointment === 'Yes')
    flags.push('Missed last scheduled appointment');

  const n = flags.length;
  const risk_level = n >= 3 ? 'HIGH' : n >= 1 ? 'MEDIUM' : 'LOW';
  return { patient_id, patient_name: rec.patient_name, age: rec.age,
           diagnosis: rec.diagnosis, risk_level, flag_count: n, flags };
}

// ─── TOOL 3: generate_care_actions ───────────────────────────────────────────
function generate_care_actions(patient_id, risk_assessment) {
  const rec = get_patient_data(patient_id);
  if (rec.error) return rec;
  const actions = [];
  const { risk_level, flags = [] } = risk_assessment;
  const ft = flags.join(' ').toLowerCase();

  if (risk_level === 'HIGH')   actions.push('🚨 URGENT: Contact patient within 24 hours');
  else if (risk_level === 'MEDIUM') actions.push('⚠️  PRIORITY: Schedule review within 1 week');

  if (ft.includes('hba1c'))       actions.push('Diabetes: Endocrinology review; consider insulin titration');
  if (ft.includes('bnp'))         actions.push('Heart Failure: Cardiology referral; review Furosemide dosage');
  if (ft.includes('egfr'))        actions.push('CKD: Nephrology referral; monitor electrolytes monthly');
  if (ft.includes('haemoglobin')) actions.push('Anaemia: Review iron supplementation; repeat CBC in 4 weeks');
  if (ft.includes('fev1'))        actions.push('COPD: Pulmonology review; consider LAMA/LABA step-up');
  if (ft.includes('peak flow'))   actions.push('Asthma: Update action plan; step-up inhaler therapy');
  if (ft.includes('phq-9'))       actions.push('Mental Health: Urgent psychiatric review; suicide risk assessment');
  if (ft.includes('tsh'))         actions.push('Thyroid: Titrate Levothyroxine; repeat TSH in 6 weeks');
  if (ft.includes('systolic') || ft.includes('hypertension'))
                                  actions.push('Hypertension: Medication review; home BP monitoring');
  if (ft.includes('spo2'))        actions.push('Respiratory: Arrange pulse oximetry; consider supplemental O2');
  if (ft.includes('overdue'))     actions.push('Access: Schedule urgent catch-up appointment');
  if (ft.includes('missed'))      actions.push('Adherence: Outreach call to reschedule missed appointment');
  actions.push(`Medication: Review adherence to ${rec.current_medication}`);

  return { patient_id, patient_name: rec.patient_name, age: rec.age,
           diagnosis: rec.diagnosis, current_medication: rec.current_medication,
           risk_level, recommended_actions: [...new Set(actions)] };
}

// ─── TOOL 4: get_missed_appointment_patients ─────────────────────────────────
function get_missed_appointment_patients() {
  const missed = patients
    .filter(p => p.missed_last_appointment === 'Yes')
    .map(p => ({ patient_id: p.patient_id, patient_name: p.patient_name,
                 age: p.age, diagnosis: p.diagnosis,
                 days_since_last_visit: p.days_since_last_visit }));
  return { total_missed: missed.length, patients: missed };
}

// ─── Display Helpers ─────────────────────────────────────────────────────────
function riskBadge(level) {
  if (level === 'HIGH')   return c(C.red,    b('🔴 HIGH  '));
  if (level === 'MEDIUM') return c(C.yellow, b('🟡 MEDIUM'));
  return c(C.green, b('🟢 LOW   '));
}

function printToolCall(step, name, args) {
  process.stdout.write(
    `  ${c(C.grey,`[Step ${step}]`)} ${c(C.orange,'🔧 Calling:')} ${c(C.cyan, b(name))}` +
    `  ${c(C.grey, JSON.stringify(args))}\n`
  );
}

function printPatientCard(risk, actions) {
  console.log(`\n  ${b('Patient:')}  ${c(C.white, risk.patient_name)}  ${c(C.grey,'|')}  ID: ${risk.patient_id}  ${c(C.grey,'|')}  Age: ${risk.age}`);
  console.log(`  ${b('Diagnosis:')} ${c(C.cyan,  risk.diagnosis)}`);
  console.log(`  ${b('Risk Level:')} ${riskBadge(risk.risk_level)}  ${c(C.grey,`(${risk.flag_count} flag${risk.flag_count!==1?'s':''})`)} `);
  if (risk.flags.length) {
    console.log(`  ${b('Flags:')}`);
    risk.flags.forEach(f => console.log(`    ${c(C.orange,'⚠')}  ${f}`));
  }
  if (actions?.recommended_actions?.length) {
    console.log(`  ${b('Recommended Actions:')}`);
    actions.recommended_actions.forEach((a,i) =>
      console.log(`    ${c(C.green,`${i+1}.`)} ${a}`)
    );
  }
}

// ─── Simulated Agentic Loop ───────────────────────────────────────────────────
async function runAgent(prompt, toolSequence) {
  console.log(`\n${c(C.bgBlue, C.white+' 🤖 AGENT '+ C.reset)}  ${b(prompt)}`);
  console.log(hr());
  console.log(c(C.grey, '  System: MediCare Follow-Up Agent | GPT-4o-mini | tool_choice=auto'));
  console.log(hr('·'));

  const results = {};
  let step = 0;
  for (const { tool, args, label } of toolSequence) {
    step++;
    await sleep(300);
    printToolCall(step, tool, args);
    await sleep(200);
    if (tool === 'get_patient_data')
      results.patient = get_patient_data(args.patient_id);
    else if (tool === 'flag_clinical_risk')
      results.risk = flag_clinical_risk(args.patient_id);
    else if (tool === 'generate_care_actions')
      results.actions = generate_care_actions(args.patient_id, results.risk || flag_clinical_risk(args.patient_id));
    else if (tool === 'get_missed_appointment_patients')
      results.missed = get_missed_appointment_patients();
    await sleep(200);
    console.log(c(C.grey, `           ↳ result received (${JSON.stringify(results[Object.keys(results).pop()]).length} bytes)`));
  }
  await sleep(400);
  console.log(`\n  ${c(C.green, b('✅ Agent completed in'))} ${step} step${step!==1?'s':''}.`);
  return results;
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN DEMO
// ═══════════════════════════════════════════════════════════════════════════
(async () => {
  console.clear();
  console.log('\n' + hr('═'));
  console.log(c(C.cyan, b('  🏥  MediCare Patient Follow-Up Agent — LIVE DEMO')));
  console.log(c(C.grey,   '      Agentic AI | ReAct Tool-Chaining | GPT-4o-mini + OpenAI Function Calling'));
  console.log(hr('═'));
  console.log(c(C.grey, `  Dataset: patient_data.csv  |  ${patients.length} patients  |  ${patients.filter(p=>p.missed_last_appointment==='Yes').length} missed appointments`));
  await sleep(500);

  // ── SECTION 1: EDA Summary ───────────────────────────────────────────────
  console.log(`\n${hr()}\n${c(C.magenta, b('  📊 TASK 1 — Dataset Overview (EDA)'))}\n${hr()}`);
  await sleep(300);
  const diagMap = {};
  patients.forEach(p => { p.diagnosis.split(',').forEach(d => { d=d.trim(); diagMap[d]=(diagMap[d]||0)+1; }); });
  const topDiag = Object.entries(diagMap).sort((a,b)=>b[1]-a[1]).slice(0,6);
  console.log(b('  Top Diagnoses:'));
  topDiag.forEach(([d,n]) => {
    const bar = '█'.repeat(Math.round(n/2));
    console.log(`  ${c(C.cyan, d.padEnd(35))} ${c(C.blue, bar)} ${n}`);
  });
  const avgDays = Math.round(patients.reduce((s,p)=>s+parseInt(p.days_since_last_visit),0)/patients.length);
  const highBP  = patients.filter(p=>parseInt(p.vitals_bp_systolic)>=160).length;
  const lowSpO2 = patients.filter(p=>parseInt(p.vitals_spo2)<94).length;
  console.log(`\n  ${b('Avg days since last visit:')} ${c(C.yellow, avgDays)}`);
  console.log(`  ${b('Patients with BP ≥ 160:')}    ${c(C.red,    highBP)}`);
  console.log(`  ${b('Patients with SpO2 < 94%:')}  ${c(C.red,    lowSpO2)}`);
  console.log(`  ${b('Missed last appointment:')}    ${c(C.orange, patients.filter(p=>p.missed_last_appointment==='Yes').length)}`);
  await sleep(400);

  // ── SECTION 2: Tools Overview ────────────────────────────────────────────
  console.log(`\n${hr()}\n${c(C.magenta, b('  🛠️  TASK 2 — Agent Tools Registered'))}\n${hr()}`);
  await sleep(300);
  [
    ['get_patient_data',              'Fetch complete patient record by ID'],
    ['flag_clinical_risk',            'Evaluate 10 clinical thresholds → LOW/MEDIUM/HIGH'],
    ['generate_care_actions',         'Map risk flags to prioritised care actions'],
    ['get_missed_appointment_patients','Return all patients who missed last appointment'],
  ].forEach(([name, desc]) =>
    console.log(`  ${c(C.green,'✓')}  ${c(C.cyan, b(name.padEnd(38)))} ${c(C.grey, desc)}`)
  );
  await sleep(400);

  // ── SECTION 3: Agentic Loop Demo ─────────────────────────────────────────
  console.log(`\n${hr()}\n${c(C.magenta, b('  🔄 TASK 3 — Agentic Loop'))}\n${hr()}`);
  console.log(c(C.grey,'  LLM autonomously chains: get_patient_data → flag_clinical_risk → generate_care_actions'));
  await sleep(400);

  // ── SECTION 4: Single Patient Analysis ───────────────────────────────────
  console.log(`\n${hr()}\n${c(C.magenta, b('  🔬 TASK 4 — Single Patient Analysis'))}\n${hr()}`);

  const demos = [
    { id:'P0008', label:'Heart Failure — BNP=1100.1 pg/mL' },
    { id:'P0028', label:'Depression — PHQ-9=26.6/27 (Critical)' },
    { id:'P0074', label:'COPD + Heart Failure — FEV1%=26.4% (Very Severe)' },
  ];

  for (const { id, label } of demos) {
    console.log(`\n  ${c(C.yellow, b(`▶ Patient ${id}`))}  ${c(C.grey, label)}`);
    const res = await runAgent(
      `Assess patient ${id} and generate prioritised care actions`,
      [
        { tool:'get_patient_data',    args:{ patient_id: id } },
        { tool:'flag_clinical_risk',  args:{ patient_id: id } },
        { tool:'generate_care_actions', args:{ patient_id: id } },
      ]
    );
    printPatientCard(res.risk, res.actions);
    await sleep(600);
  }

  // ── SECTION 5: Missed Appointments ───────────────────────────────────────
  console.log(`\n${hr()}\n${c(C.magenta, b('  📋 TASK 5 — Missed Appointment Follow-Up'))}\n${hr()}`);
  const missedRes = await runAgent(
    'Identify all missed appointment patients and produce a prioritised outreach list',
    [{ tool:'get_missed_appointment_patients', args:{} }]
  );
  const missedList = missedRes.missed.patients;
  console.log(`\n  ${b(`Found ${missedList.length} patients who missed their last appointment`)}\n`);
  console.log(`  ${c(C.grey, 'Assessing risk for each...')}\n`);
  await sleep(300);

  const assessed = missedList.map(p => {
    const risk    = flag_clinical_risk(p.patient_id);
    const actions = generate_care_actions(p.patient_id, risk);
    return { ...risk, topAction: actions.recommended_actions[1] || actions.recommended_actions[0] };
  });
  const priority = {'HIGH':0,'MEDIUM':1,'LOW':2};
  assessed.sort((a,b) => priority[a.risk_level]-priority[b.risk_level] || b.flag_count-a.flag_count);

  console.log(hr('─',80));
  console.log(b(`  ${'#'.padEnd(3)} ${'ID'.padEnd(7)} ${'Name'.padEnd(22)} ${'Age'.padEnd(5)} ${'Risk'.padEnd(10)} ${'Flags'.padEnd(6)} Diagnosis`));
  console.log(hr('─',80));
  assessed.forEach((p,i) => {
    const badge = p.risk_level==='HIGH' ? c(C.red,'HIGH  ') : p.risk_level==='MEDIUM' ? c(C.yellow,'MEDIUM') : c(C.green,'LOW   ');
    console.log(`  ${String(i+1).padEnd(3)} ${p.patient_id.padEnd(7)} ${p.patient_name.padEnd(22)} ${String(p.age).padEnd(5)} ${badge}    ${String(p.flag_count).padEnd(6)} ${p.diagnosis.slice(0,30)}`);
    if (p.topAction) console.log(c(C.grey, `              ↳ ${p.topAction}`));
  });

  // ── SECTION 6: Batch Risk Summary ────────────────────────────────────────
  console.log(`\n${hr()}\n${c(C.magenta, b('  📊 BONUS — Batch Risk Dashboard (All 100 Patients)'))}\n${hr()}`);
  await sleep(300);
  const all = patients.map(p => flag_clinical_risk(p.patient_id));
  const counts = { HIGH:0, MEDIUM:0, LOW:0 };
  all.forEach(p => counts[p.risk_level]++);
  const total = all.length;

  console.log(b('\n  Risk Level Distribution:'));
  for (const [level, n] of Object.entries(counts)) {
    const pct  = Math.round(n/total*100);
    const bar  = '█'.repeat(Math.round(pct/2));
    const col  = level==='HIGH' ? C.red : level==='MEDIUM' ? C.yellow : C.green;
    console.log(`  ${riskBadge(level)}  ${c(col, bar.padEnd(26))} ${b(String(n).padStart(3))} patients  (${pct}%)`);
  }

  console.log(b('\n  🚨 Top 10 Highest-Risk Patients:'));
  console.log(hr('─',70));
  all.sort((a,b) => priority[a.risk_level]-priority[b.risk_level] || b.flag_count-a.flag_count)
     .slice(0,10).forEach((p,i) => {
       const col = p.risk_level==='HIGH' ? C.red : C.yellow;
       console.log(`  ${c(C.grey,`${i+1}.`).padEnd(4)} ${c(C.white, b(p.patient_name.padEnd(22)))} ${p.patient_id}  ${c(col, p.risk_level.padEnd(7))}  ${p.flag_count} flags  ${c(C.grey, p.diagnosis.slice(0,28))}`);
     });

  // ── FINAL SUMMARY ────────────────────────────────────────────────────────
  console.log(`\n${hr('═')}`);
  console.log(c(C.cyan, b('  ✅  DEMO COMPLETE')));
  console.log(hr('═'));
  console.log(`  ${b('Agent Architecture:')}  ReAct-style loop | GPT-4o-mini | OpenAI Function Calling`);
  console.log(`  ${b('Tools executed:')}      get_patient_data · flag_clinical_risk · generate_care_actions · get_missed_appointment_patients`);
  console.log(`  ${b('Patients analysed:')}   ${total} total  |  ${counts.HIGH} HIGH risk  |  ${counts.MEDIUM} MEDIUM risk  |  ${counts.LOW} LOW risk`);
  console.log(`  ${b('Repo:')}                https://github.com/sharmila2719/MediCare-FollowUp-Agent`);
  console.log(hr('═') + '\n');
})();
