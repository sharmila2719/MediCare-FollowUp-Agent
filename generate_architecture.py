import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
from matplotlib.patches import FancyBboxPatch, FancyArrowPatch

fig, ax = plt.subplots(figsize=(18, 22))
ax.set_xlim(0, 18)
ax.set_ylim(0, 22)
ax.axis('off')
fig.patch.set_facecolor('#0d1117')

def box(ax, x, y, w, h, color, alpha=1.0, radius=0.3):
    ax.add_patch(FancyBboxPatch((x, y), w, h,
        boxstyle=f"round,pad=0.05,rounding_size={radius}",
        linewidth=1.5, edgecolor='#30363d', facecolor=color, alpha=alpha, zorder=2))

def arrow(ax, x1, y1, x2, y2, color='#58a6ff'):
    ax.annotate('', xy=(x2, y2), xytext=(x1, y1),
        arrowprops=dict(arrowstyle='->', color=color, lw=2.0), zorder=3)

def txt(ax, x, y, s, size=9, color='white', weight='normal', ha='center', va='center'):
    ax.text(x, y, s, fontsize=size, color=color, fontweight=weight,
            ha=ha, va=va, zorder=4, fontfamily='monospace')

# ── Title ──────────────────────────────────────────────────────────────────
box(ax, 0.3, 20.5, 17.4, 1.2, '#161b22')
txt(ax, 9, 21.3, '🏥  MediCare Patient Follow-Up Agent', size=15, weight='bold', color='#58a6ff')
txt(ax, 9, 20.8, 'Agentic AI Architecture  |  ReAct-Style Tool-Chaining Loop', size=10, color='#8b949e')

# ── Row 1: Input + Data Layer ──────────────────────────────────────────────
# Input
box(ax, 0.3, 18.0, 3.8, 2.0, '#1a2332')
txt(ax, 2.2, 19.7, '📥  INPUT', size=10, weight='bold', color='#79c0ff')
txt(ax, 2.2, 19.2, 'User Clinical Prompt', size=8.5, color='#e6edf3')
txt(ax, 2.2, 18.8, '"Assess patient P0008"', size=8, color='#8b949e')
txt(ax, 2.2, 18.4, '"Find missed appointments"', size=8, color='#8b949e')

# Data Layer
box(ax, 4.5, 18.0, 13.2, 2.0, '#1a2332')
txt(ax, 11.1, 19.7, '🗄️  DATA LAYER  —  patient_data.csv  (100 records)', size=10, weight='bold', color='#79c0ff')
for i, (col, val) in enumerate([
    ('patient_id', 'P0001…P0100'),
    ('diagnosis',  'Diabetes / HF / COPD…'),
    ('lab_test',   'HbA1c / BNP / eGFR…'),
    ('vitals',     'BP / SpO2 / HR'),
    ('days_since', 'Last visit gap'),
    ('missed_appt','Yes / No'),
]):
    bx = 4.9 + i * 2.15
    box(ax, bx, 18.1, 2.0, 1.55, '#21262d')
    txt(ax, bx+1.0, 19.35, col,  size=7.5, color='#f0883e', weight='bold')
    txt(ax, bx+1.0, 18.75, val,  size=7,   color='#8b949e')

# Arrows row1 → agentic loop
arrow(ax, 2.2, 18.0, 2.2, 16.75)
arrow(ax, 11.1, 18.0, 11.1, 16.75)

# ── Agentic Loop ───────────────────────────────────────────────────────────
box(ax, 0.3, 13.2, 17.4, 3.5, '#161b22')
txt(ax, 9, 16.4, '🔄  AGENTIC LOOP  —  run_agent()', size=11, weight='bold', color='#56d364')

# LLM box
box(ax, 1.0, 13.6, 6.5, 2.4, '#1f2d3d')
txt(ax, 4.25, 15.65, '🤖  LLM  —  GPT-4o-mini', size=10, weight='bold', color='#79c0ff')
txt(ax, 4.25, 15.2,  'OpenAI Chat Completions API', size=8.5, color='#e6edf3')
txt(ax, 4.25, 14.8,  'tool_choice = "auto"', size=8.5, color='#f0883e')
txt(ax, 4.25, 14.4,  'Decides WHICH tools to call & in what order', size=8, color='#8b949e')
txt(ax, 4.25, 14.05, 'No hardcoded routing — fully autonomous', size=8, color='#8b949e')

# Tool Dispatcher box
box(ax, 8.5, 13.6, 4.5, 2.4, '#1f2d3d')
txt(ax, 10.75, 15.65, '⚙️  Tool Dispatcher', size=10, weight='bold', color='#79c0ff')
txt(ax, 10.75, 15.2,  'TOOL_MAP { }', size=9, color='#f0883e')
txt(ax, 10.75, 14.75, 'Maps LLM function names', size=8.5, color='#e6edf3')
txt(ax, 10.75, 14.35, '→ Python implementations', size=8.5, color='#e6edf3')
txt(ax, 10.75, 13.95, 'Max 12 iterations (safety cap)', size=8, color='#8b949e')

# Final Response box
box(ax, 13.8, 13.6, 3.6, 2.4, '#1a3320')
txt(ax, 15.6, 15.65, '✅  Final', size=10, weight='bold', color='#56d364')
txt(ax, 15.6, 15.2,  'Response', size=10, weight='bold', color='#56d364')
txt(ax, 15.6, 14.75, 'Narrative output', size=8.5, color='#e6edf3')
txt(ax, 15.6, 14.35, 'for care team', size=8.5, color='#e6edf3')
txt(ax, 15.6, 13.95, '(no tool calls)', size=8, color='#8b949e')

# Arrows inside loop
arrow(ax, 7.5,  14.8, 8.5,  14.8)           # LLM → Dispatcher
arrow(ax, 10.75, 13.6, 10.75, 12.4)         # Dispatcher → Tools
arrow(ax, 10.75, 15.0, 13.8, 14.8)          # also → Final response
# tool result feeds back
ax.annotate('', xy=(8.5, 14.2), xytext=(10.75, 12.4),
    arrowprops=dict(arrowstyle='->', color='#f0883e', lw=1.8,
    connectionstyle='arc3,rad=0.3'), zorder=3)
txt(ax, 8.9, 12.9, 'tool result\n→ messages[]', size=7.5, color='#f0883e', ha='left')

# ── Tool Layer ─────────────────────────────────────────────────────────────
box(ax, 0.3, 7.8, 17.4, 4.3, '#161b22')
txt(ax, 9, 11.8, '🛠️  TOOL LAYER  (4 Tools)', size=11, weight='bold', color='#d2a8ff')

TOOLS = [
    ('get_patient_data',           '#1f2d3d', '#79c0ff',
     ['Input: patient_id', 'Output: full patient', 'record from CSV', '← called first']),
    ('flag_clinical_risk',         '#1f2d3d', '#79c0ff',
     ['HbA1c>8% | BNP>400', 'eGFR<45 | Hb<10', 'FEV1%<50 | PHQ9>14', 'BP≥160 | SpO2<94%',
      '→ LOW/MEDIUM/HIGH']),
    ('generate_care_actions',      '#1f2d3d', '#79c0ff',
     ['Maps flags→actions:', 'Cardiology referral', 'Insulin titration', 'Psychiatric review',
      'Outreach call']),
    ('get_missed_appointment\n_patients', '#1f2d3d', '#79c0ff',
     ['Input: none', 'Output: all patients', 'missed_appt=Yes', '← Task 5 batch']),
]
for i, (name, bg, tc, lines) in enumerate(TOOLS):
    bx = 0.5 + i * 4.35
    box(ax, bx, 8.0, 4.0, 3.6, bg)
    txt(ax, bx+2.0, 11.3, name, size=8.5, color=tc, weight='bold')
    for j, line in enumerate(lines):
        txt(ax, bx+2.0, 10.85 - j*0.52, line, size=7.8, color='#e6edf3')

# ── Risk Engine ────────────────────────────────────────────────────────────
box(ax, 0.3, 5.6, 17.4, 1.9, '#161b22')
txt(ax, 9, 7.2, '⚖️  RISK STRATIFICATION ENGINE', size=11, weight='bold', color='#ffa657')
risk_items = [
    (2.5,  6.5, '🟢  LOW',    'flag_count = 0',   'Routine follow-up at next visit',    '#238636'),
    (8.0,  6.5, '🟡  MEDIUM', 'flag_count = 1–2', 'Priority review within 1 week',      '#9e6a03'),
    (13.5, 6.5, '🔴  HIGH',   'flag_count ≥ 3',   'Urgent contact within 24 hours',     '#b62324'),
]
for rx, ry, label, cond, action, col in risk_items:
    box(ax, rx-2.1, ry-0.55, 4.2, 1.55, col, alpha=0.25)
    txt(ax, rx, ry+0.6,  label,  size=10, color='white', weight='bold')
    txt(ax, rx, ry+0.15, cond,   size=8.5, color='#e6edf3')
    txt(ax, rx, ry-0.25, action, size=8,   color='#8b949e')

# ── Task Workflows ─────────────────────────────────────────────────────────
box(ax, 0.3, 2.2, 17.4, 3.1, '#161b22')
txt(ax, 9, 5.0, '📋  TASK WORKFLOWS', size=11, weight='bold', color='#ffa657')

# Task 4
box(ax, 0.5, 2.4, 8.0, 2.3, '#1a2332')
txt(ax, 4.5, 4.45, 'Task 4 — Single Patient Analysis', size=9, weight='bold', color='#79c0ff')
steps4 = ['get_patient_data', 'flag_clinical_risk', 'generate_care_actions', 'LLM Summary']
cols4  = ['#1f6feb',           '#388bfd',             '#1f6feb',               '#56d364']
for i, (s, c) in enumerate(zip(steps4, cols4)):
    bx = 0.7 + i * 1.95
    box(ax, bx, 2.55, 1.75, 0.9, c, alpha=0.35)
    txt(ax, bx+0.875, 3.0, s, size=7, color='white', weight='bold')
    if i < 3:
        arrow(ax, bx+1.75, 3.0, bx+1.95, 3.0, '#58a6ff')

# Task 5
box(ax, 9.2, 2.4, 8.3, 2.3, '#1a2332')
txt(ax, 13.35, 4.45, 'Task 5 — Missed Appointment Batch', size=9, weight='bold', color='#79c0ff')
txt(ax, 13.35, 4.0,  'get_missed_appointment_patients', size=8, color='#f0883e')
txt(ax, 13.35, 3.6,  '↓  flag_clinical_risk (each patient)', size=8, color='#e6edf3')
txt(ax, 13.35, 3.2,  '↓  LLM sorts HIGH → MEDIUM → LOW', size=8, color='#e6edf3')
txt(ax, 13.35, 2.8,  '→  Prioritised Outreach List', size=8, color='#56d364', weight='bold')

# ── Output ─────────────────────────────────────────────────────────────────
box(ax, 0.3, 0.3, 17.4, 1.6, '#1a3320')
txt(ax, 9, 1.6, '📤  OUTPUT', size=11, weight='bold', color='#56d364')
outputs = ['Risk Level\nLOW/MED/HIGH', 'Clinical\nFlags List',
           'Care Action\nPlan', 'EDA\nDashboard', 'Batch Risk\nDashboard', 'Priority\nOutreach List']
for i, o in enumerate(outputs):
    bx = 0.6 + i * 2.88
    box(ax, bx, 0.4, 2.55, 1.0, '#238636', alpha=0.3)
    txt(ax, bx+1.275, 0.9, o, size=8, color='#e6edf3', weight='bold')

# Main vertical arrows
arrow(ax, 9, 13.2, 9, 12.15)   # loop → tools
arrow(ax, 9, 7.8,  9, 7.5)     # tools → risk
arrow(ax, 9, 5.6,  9, 5.35)    # risk → workflows
arrow(ax, 9, 2.2,  9, 1.95)    # workflows → output

plt.tight_layout(pad=0.2)
plt.savefig('architecture_diagram.png', dpi=150, bbox_inches='tight',
            facecolor='#0d1117', edgecolor='none')
print('✅ architecture_diagram.png saved')
