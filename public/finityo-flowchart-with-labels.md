# Finityo Site Workflow - Page-by-Page Flowchart with Label IDs

## 🎯 ABSOLUTE GLOBAL ENFORCEMENT RULES

| Rule | Status |
|------|--------|
| Only PG_PLAN may call the engine | ✅ |
| Calendar never recomputes | ✅ |
| Charts never recomputes | ✅ |
| Summary never recomputes | ✅ |
| Compare never overwrites plan | ✅ |
| Lovable Cloud is the ONLY DB | ✅ |

---

## 📊 Mermaid Flowchart Code

```mermaid
graph TB
    %% ========================================
    %% AUTHENTICATION FLOW
    %% ========================================
    PG_AUTH[PG_AUTH<br/>Auth Page]
    BTN_LOGIN[BTN_LOGIN<br/>Login Button]
    DS_LOVABLE_CLOUD[(DS_LOVABLE_CLOUD<br/>Lovable Cloud DB)]
    WRITE_USER[WRITE_USER<br/>Session Write]
    
    PG_AUTH -->|TRG_CLICK| BTN_LOGIN
    BTN_LOGIN -->|Validate Credentials| DS_LOVABLE_CLOUD
    BTN_LOGIN -->|Create Session| WRITE_USER
    WRITE_USER -->|Redirect| PG_DASH
    
    %% ========================================
    %% DASHBOARD FLOW
    %% ========================================
    PG_DASH[PG_DASH<br/>Dashboard]
    BTN_GOTO_DEBTS[BTN_GOTO_DEBTS]
    BTN_GOTO_PLAN[BTN_GOTO_PLAN]
    BTN_GOTO_CAL[BTN_GOTO_CAL]
    BTN_GOTO_CHARTS[BTN_GOTO_CHARTS]
    
    DS_LOVABLE_CLOUD -->|Read Cached Data| PG_DASH
    PG_DASH -->|TRG_CLICK| BTN_GOTO_DEBTS
    PG_DASH -->|TRG_CLICK| BTN_GOTO_PLAN
    PG_DASH -->|TRG_CLICK| BTN_GOTO_CAL
    PG_DASH -->|TRG_CLICK| BTN_GOTO_CHARTS
    
    BTN_GOTO_DEBTS --> PG_DEBTS
    BTN_GOTO_PLAN --> PG_PLAN
    BTN_GOTO_CAL --> PG_CAL
    BTN_GOTO_CHARTS --> PG_CHARTS
    
    %% ========================================
    %% DEBTS FLOW - NO MATH ALLOWED
    %% ========================================
    PG_DEBTS[PG_DEBTS<br/>My Debts Page]
    DS_PLAID[(DS_PLAID<br/>Plaid Integration)]
    DS_IMPORT_CSV[(DS_IMPORT_CSV<br/>CSV Import)]
    
    BTN_ADD_DEBT[BTN_ADD_DEBT<br/>Add Debt]
    BTN_EDIT_DEBT[BTN_EDIT_DEBT<br/>Edit Debt]
    BTN_SAVE_DEBT[BTN_SAVE_DEBT<br/>Save Debt]
    BTN_DEL_DEBT[BTN_DEL_DEBT<br/>Delete Debt]
    BTN_IMPORT_CSV[BTN_IMPORT_CSV<br/>Import CSV]
    BTN_CONNECT_PLAID[BTN_CONNECT_PLAID<br/>Connect Plaid]
    
    WRITE_DEBTS[WRITE_DEBTS<br/>Write to Lovable Cloud]
    
    DS_PLAID -->|Pull Accounts| PG_DEBTS
    DS_IMPORT_CSV -->|Pull CSV Data| PG_DEBTS
    DS_LOVABLE_CLOUD -->|Read Debts| PG_DEBTS
    
    PG_DEBTS -->|TRG_CLICK| BTN_ADD_DEBT
    PG_DEBTS -->|TRG_CLICK| BTN_EDIT_DEBT
    PG_DEBTS -->|TRG_CLICK| BTN_SAVE_DEBT
    PG_DEBTS -->|TRG_CLICK| BTN_DEL_DEBT
    PG_DEBTS -->|TRG_CLICK| BTN_IMPORT_CSV
    PG_DEBTS -->|TRG_CLICK| BTN_CONNECT_PLAID
    
    BTN_ADD_DEBT -->|Create Draft| PG_DEBTS
    BTN_EDIT_DEBT -->|Update Draft| PG_DEBTS
    BTN_SAVE_DEBT -->|TRG_CONFIRM| WRITE_DEBTS
    BTN_DEL_DEBT -->|Delete| DS_LOVABLE_CLOUD
    BTN_IMPORT_CSV --> DS_IMPORT_CSV
    BTN_CONNECT_PLAID --> DS_PLAID
    
    WRITE_DEBTS --> DS_LOVABLE_CLOUD
    
    %% ========================================
    %% PLAN FLOW - THE ONLY MATH CONTROL CENTER
    %% ========================================
    PG_PLAN[PG_PLAN<br/>Debt Plan Page<br/>⚠️ ONLY MATH ZONE]
    DS_ENGINE[(DS_ENGINE<br/>Engine Output Cache)]
    
    BTN_COMPUTE_PLAN[BTN_COMPUTE_PLAN<br/>⚡ MAIN ENGINE ENTRY]
    BTN_APPLY_ONETIME[BTN_APPLY_ONETIME<br/>Apply One-Time]
    BTN_CLEAR_PLAN[BTN_CLEAR_PLAN<br/>Clear Plan]
    BTN_SAVE_PLAN[BTN_SAVE_PLAN<br/>Save Plan]
    
    ENG_COMPUTE_PLAN[ENG_COMPUTE_PLAN<br/>Main Calculation Engine]
    ENG_APPLY_ONETIME[ENG_APPLY_ONETIME<br/>One-Time Payment Engine]
    ENG_ACCRUE_INTEREST[ENG_ACCRUE_INTEREST<br/>Interest Accrual]
    ENG_GROW_SNOWBALL[ENG_GROW_SNOWBALL<br/>Snowball Growth]
    
    WRITE_PLAN[WRITE_PLAN<br/>Write Plan to Cloud]
    WRITE_HISTORY[WRITE_HISTORY<br/>Write Version History]
    
    DS_LOVABLE_CLOUD -->|Read Inputs| PG_PLAN
    DS_PLAID -->|Read Accounts| PG_PLAN
    DS_IMPORT_CSV -->|Read Data| PG_PLAN
    
    PG_PLAN -->|TRG_CLICK| BTN_COMPUTE_PLAN
    PG_PLAN -->|TRG_CLICK| BTN_APPLY_ONETIME
    PG_PLAN -->|TRG_CLICK| BTN_CLEAR_PLAN
    PG_PLAN -->|TRG_CLICK| BTN_SAVE_PLAN
    
    BTN_COMPUTE_PLAN -->|Execute| ENG_COMPUTE_PLAN
    BTN_APPLY_ONETIME -->|Execute Before Month 1| ENG_APPLY_ONETIME
    BTN_CLEAR_PLAN -->|Clear Local Only| PG_PLAN
    BTN_SAVE_PLAN -->|Persist| WRITE_PLAN
    BTN_SAVE_PLAN -->|Snapshot| WRITE_HISTORY
    
    ENG_COMPUTE_PLAN --> ENG_APPLY_ONETIME
    ENG_COMPUTE_PLAN --> ENG_ACCRUE_INTEREST
    ENG_COMPUTE_PLAN --> ENG_GROW_SNOWBALL
    
    ENG_COMPUTE_PLAN -->|Output: planMonths[]| DS_ENGINE
    ENG_COMPUTE_PLAN -->|Output: payoffDate| DS_ENGINE
    ENG_COMPUTE_PLAN -->|Output: totalInterest| DS_ENGINE
    
    WRITE_PLAN --> DS_LOVABLE_CLOUD
    WRITE_HISTORY --> DS_LOVABLE_CLOUD
    
    %% ========================================
    %% CALENDAR FLOW - NO RECOMPUTE ALLOWED
    %% ========================================
    PG_CAL[PG_CAL<br/>Payoff Calendar<br/>✅ READ ONLY]
    DEP_CAL_FROM_PLAN[DEP_CAL_FROM_PLAN<br/>Depends on Cached Plan]
    DEP_CAL_NO_RECOMPUTE[DEP_CAL_NO_RECOMPUTE<br/>❌ No Engine Access]
    
    DS_ENGINE -->|Read Cached Plan| PG_CAL
    DS_LOVABLE_CLOUD -->|Read Stored Plan| PG_CAL
    
    DEP_CAL_FROM_PLAN -.->|Constraint| PG_CAL
    DEP_CAL_NO_RECOMPUTE -.->|Constraint| PG_CAL
    
    %% ========================================
    %% CHARTS FLOW - NO RECOMPUTE ALLOWED
    %% ========================================
    PG_CHARTS[PG_CHARTS<br/>Visualizations<br/>✅ READ ONLY]
    DEP_CHARTS_FROM_PLAN[DEP_CHARTS_FROM_PLAN<br/>Depends on Cached Plan]
    DEP_CHARTS_NO_RECOMPUTE[DEP_CHARTS_NO_RECOMPUTE<br/>❌ No Engine Access]
    
    DS_ENGINE -->|Read Cached Plan| PG_CHARTS
    DS_LOVABLE_CLOUD -->|Read Stored Plan| PG_CHARTS
    
    DEP_CHARTS_FROM_PLAN -.->|Constraint| PG_CHARTS
    DEP_CHARTS_NO_RECOMPUTE -.->|Constraint| PG_CHARTS
    
    %% ========================================
    %% SUMMARY FLOW - NO RECOMPUTE ALLOWED
    %% ========================================
    PG_SUMMARY[PG_SUMMARY<br/>Results Summary<br/>✅ READ ONLY]
    SUM_PAYOFF_DATE[SUM_PAYOFF_DATE<br/>Payoff Date Display]
    SUM_TOTAL_INTEREST[SUM_TOTAL_INTEREST<br/>Total Interest Display]
    SUM_TOTAL_MONTHS[SUM_TOTAL_MONTHS<br/>Total Months Display]
    
    BTN_EXPORT_SUMMARY[BTN_EXPORT_SUMMARY<br/>Export Summary]
    BTN_SHARE_SUMMARY[BTN_SHARE_SUMMARY<br/>Share Summary]
    
    DS_ENGINE -->|Read Cached Plan| PG_SUMMARY
    DS_LOVABLE_CLOUD -->|Read Stored Plan| PG_SUMMARY
    
    PG_SUMMARY --> SUM_PAYOFF_DATE
    PG_SUMMARY --> SUM_TOTAL_INTEREST
    PG_SUMMARY --> SUM_TOTAL_MONTHS
    
    PG_SUMMARY -->|TRG_CLICK| BTN_EXPORT_SUMMARY
    PG_SUMMARY -->|TRG_CLICK| BTN_SHARE_SUMMARY
    
    %% ========================================
    %% COMPARE FLOW - VIEW ONLY MODE
    %% ========================================
    PG_COMPARE[PG_COMPARE<br/>Strategy Comparison<br/>⚠️ VIEW ONLY]
    BTN_RUN_COMPARE[BTN_RUN_COMPARE<br/>Run Comparison]
    ENG_COMPARE_STRATEGY[ENG_COMPARE_STRATEGY<br/>Compare Snowball vs Avalanche]
    
    PG_COMPARE -->|TRG_CLICK| BTN_RUN_COMPARE
    BTN_RUN_COMPARE -->|Execute| ENG_COMPARE_STRATEGY
    
    ENG_COMPARE_STRATEGY -->|Output: Snowball Plan| PG_COMPARE
    ENG_COMPARE_STRATEGY -->|Output: Avalanche Plan| PG_COMPARE
    
    %% ========================================
    %% SETTINGS FLOW - ZERO MATH INFLUENCE
    %% ========================================
    PG_SETTINGS[PG_SETTINGS<br/>App Settings<br/>✅ NO MATH]
    BTN_TOGGLE_THEME[BTN_TOGGLE_THEME<br/>Toggle Theme]
    BTN_SET_CURRENCY[BTN_SET_CURRENCY<br/>Set Currency]
    BTN_SET_DEFAULT_STRATEGY[BTN_SET_DEFAULT_STRATEGY<br/>Set Strategy]
    
    PG_SETTINGS -->|TRG_CLICK| BTN_TOGGLE_THEME
    PG_SETTINGS -->|TRG_CLICK| BTN_SET_CURRENCY
    PG_SETTINGS -->|TRG_CLICK| BTN_SET_DEFAULT_STRATEGY
    
    BTN_TOGGLE_THEME --> DS_LOVABLE_CLOUD
    BTN_SET_CURRENCY --> DS_LOVABLE_CLOUD
    BTN_SET_DEFAULT_STRATEGY --> DS_LOVABLE_CLOUD
    
    %% ========================================
    %% SHARE FLOW - NO RECOMPUTE ALLOWED
    %% ========================================
    PG_SHARE[PG_SHARE<br/>Share System<br/>✅ CACHED ONLY]
    BTN_GENERATE_CARD[BTN_GENERATE_CARD<br/>Generate Share Card]
    BTN_COPY_LINK[BTN_COPY_LINK<br/>Copy Share Link]
    
    DS_ENGINE -->|Read Final Cached Plan| PG_SHARE
    DS_LOVABLE_CLOUD -->|Read Stored Plan| PG_SHARE
    
    PG_SHARE -->|TRG_CLICK| BTN_GENERATE_CARD
    PG_SHARE -->|TRG_CLICK| BTN_COPY_LINK
    
    %% ========================================
    %% STYLING
    %% ========================================
    classDef authPage fill:#e1f5ff,stroke:#0288d1,stroke-width:2px
    classDef mathPage fill:#ffebee,stroke:#c62828,stroke-width:3px
    classDef readPage fill:#e8f5e9,stroke:#388e3c,stroke-width:2px
    classDef engine fill:#fff3e0,stroke:#f57c00,stroke-width:2px
    classDef dataSource fill:#f3e5f5,stroke:#7b1fa2,stroke-width:2px
    classDef button fill:#e3f2fd,stroke:#1976d2,stroke-width:1px
    classDef write fill:#fce4ec,stroke:#c2185b,stroke-width:2px
    classDef constraint fill:#fff9c4,stroke:#f57f17,stroke-width:1px,stroke-dasharray: 5 5
    
    class PG_AUTH authPage
    class PG_PLAN mathPage
    class PG_CAL,PG_CHARTS,PG_SUMMARY,PG_SHARE readPage
    class PG_DASH,PG_DEBTS,PG_COMPARE,PG_SETTINGS authPage
    class ENG_COMPUTE_PLAN,ENG_APPLY_ONETIME,ENG_ACCRUE_INTEREST,ENG_GROW_SNOWBALL,ENG_COMPARE_STRATEGY engine
    class DS_LOVABLE_CLOUD,DS_PLAID,DS_IMPORT_CSV,DS_ENGINE dataSource
    class WRITE_USER,WRITE_DEBTS,WRITE_PLAN,WRITE_HISTORY write
    class DEP_CAL_FROM_PLAN,DEP_CAL_NO_RECOMPUTE,DEP_CHARTS_FROM_PLAN,DEP_CHARTS_NO_RECOMPUTE constraint
```

---

## 🎨 Color Legend

- **Blue (Auth Pages)**: PG_AUTH, PG_DASH, PG_DEBTS, PG_COMPARE, PG_SETTINGS
- **Red (Math Zone)**: PG_PLAN - THE ONLY PAGE THAT CALLS ENGINE
- **Green (Read-Only)**: PG_CAL, PG_CHARTS, PG_SUMMARY, PG_SHARE
- **Orange (Engines)**: ENG_COMPUTE_PLAN, ENG_APPLY_ONETIME, ENG_ACCRUE_INTEREST, ENG_GROW_SNOWBALL, ENG_COMPARE_STRATEGY
- **Purple (Data Sources)**: DS_LOVABLE_CLOUD, DS_PLAID, DS_IMPORT_CSV, DS_ENGINE
- **Pink (Write Operations)**: WRITE_USER, WRITE_DEBTS, WRITE_PLAN, WRITE_HISTORY
- **Yellow (Constraints)**: DEP_* dependencies showing enforcement rules

---

## 📥 How to Convert to PDF

1. Copy the Mermaid code above
2. Visit https://mermaid.live/
3. Paste the code
4. Click "Actions" → "Export as PNG/SVG/PDF"
5. Save your visual flowchart

Alternatively, use VS Code with Mermaid extension or command-line tools like `mmdc` (Mermaid CLI).
