export function verify(problem, witness) {
  const required = new Set(problem.requiredCapabilities || ["validateLedgerEntry", "scheduleBorrows"]);
  const selected = witness?.selectedSkills || [];
  const capabilities = new Set((witness?.capabilities || []).flat());
  for (const cap of required) if (!capabilities.has(cap)) return false;
  return selected.length > 0 && Number.isFinite(Number(witness.cost)) && Number(witness.cost) >= 0;
}
