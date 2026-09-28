const planFigures = [
  { value: "50", label: "Monthly Need", detail: "Amazon Accounts" },
  { value: "33", label: "Progress SEP", detail: "Already Achieved" },
  { value: "17", label: "Current Gap", detail: "Remaining Accounts" },
  { value: "$440", label: "Received from Manager" },
  { value: "$68", label: "Current Cash Balance" },
  { value: "$50", label: "Reserved for 10 US Accounts" },
];

const budgetNotes = [
  "$372 already spent from the $440 received.",
  "$68 remains in hand now.",
  "$50 is planned for 10 US accounts, leaving about $18 unallocated after that purchase.",
  "After the planned 10 US accounts, the Amazon monthly gap should drop from 17 to 7 accounts.",
  "Remaining non-US gap after US purchase: NL, MX, ES, IT, CA, FR, JP — one account each.",
];

export function MonthlyPlanSummary() {
  return <section className="monthly-plan panel" aria-labelledby="monthly-plan-title">
    <header>
      <p className="eyebrow">MONTHLY OVERVIEW</p>
      <h2 id="monthly-plan-title">Monthly Plan &amp; Budget Position</h2>
      <p>September Amazon gap plus budget already received and allocated.</p>
    </header>

    <div className="monthly-plan-figures">
      {planFigures.map((figure) => <article key={figure.label}>
        <strong>{figure.value}</strong>
        <span>{figure.label}</span>
        {figure.detail && <small>{figure.detail}</small>}
      </article>)}
    </div>

    <div className="budget-summary">
      <h3>Budget Summary</h3>
      <ul>{budgetNotes.map((note) => <li key={note}>{note}</li>)}</ul>
    </div>
  </section>;
}
