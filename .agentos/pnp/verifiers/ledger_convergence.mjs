export function verify(_problem, witness) {
  const transitions = witness?.transitions || [];
  if (!Array.isArray(transitions) || transitions.length === 0) return false;
  let balance = 0;
  for (const tx of transitions) {
    const debit = Number(tx.debit || 0);
    const credit = Number(tx.credit || 0);
    if (debit < 0 || credit < 0) return false;
    balance += debit - credit;
  }
  return balance === 0;
}
