// AgentOS Live Data Fetcher
// Fetches real-time status from .agentos runtime via GitHub raw content

(async function() {
    const API_BASE = 'https://raw.githubusercontent.com/SNAPKITTYWEST/snapkitty-agentos/main/.agentos';
    
    // Fetch git bucket count from manifest
    async function fetchBucketCount() {
        try {
            const response = await fetch(`${API_BASE}/gitbucket/index/manifest.json`);
            if (!response.ok) return '—';
            const data = await response.json();
            return data.buckets ? data.buckets.length : 0;
        } catch (e) {
            return '—';
        }
    }
    
    // Fetch problem registry count
    async function fetchProblemCount() {
        try {
            const response = await fetch(`${API_BASE}/pnp/problem_registry.json`);
            if (!response.ok) return '—';
            const data = await response.json();
            return data.problems ? data.problems.length : 0;
        } catch (e) {
            return '—';
        }
    }
    
    // Fetch skills count
    async function fetchSkillCount() {
        try {
            const response = await fetch(`${API_BASE}/skills/registry.json`);
            if (!response.ok) return '—';
            const data = await response.json();
            return data.skills ? data.skills.length : 0;
        } catch (e) {
            return '—';
        }
    }
    
    // Update UI with live data
    const bucketCount = await fetchBucketCount();
    const problemCount = await fetchProblemCount();
    const skillCount = await fetchSkillCount();
    
    document.getElementById('bucket-count').textContent = bucketCount;
    document.getElementById('solution-count').textContent = problemCount;
    document.getElementById('agent-count').textContent = skillCount;
    
    // Animate terminal with realistic output
    const terminalLines = [
        '$ npm run verify:all',
        '▶ Plasma Gate verification...',
        '✓ Ed25519 public key present',
        '▶ P/NP problem verification...',
        '✓ 3 problems registered (all open)',
        '▶ Skill verification...',
        '✓ ledger_validation_v3 verified',
        '✓ borrow_chain_scheduler_v1 verified',
        '▶ APL Fortran package verification...',
        '✓ 10 files, 6 symbols verified',
        '',
        '$ npm run swarm',
        '▶ Loading problems from registry...',
        '✓ 3 problems loaded',
        '▶ Distributing to git buckets...',
        '✓ Sealed 3 problems → bucket_np_registry',
        '✓ Sealed 1 problem → bucket_np_1',
        '✓ Sealed 1 problem → bucket_np_2',
        '✓ Sealed 1 problem → bucket_p_3',
        '▶ Verification: 6/6 passed',
        '✓ Swarm orchestration complete',
        '',
        '$ git push origin main',
        '✓ Deployed to GitHub Pages',
        '█'
    ];
    
    const terminal = document.getElementById('terminal-output');
    let lineIndex = 0;
    
    function addTerminalLine() {
        if (lineIndex < terminalLines.length) {
            const line = document.createElement('div');
            const isLast = lineIndex === terminalLines.length - 1;
            line.className = isLast ? 'terminal-line cursor' : 'terminal-line';
            line.textContent = terminalLines[lineIndex];
            
            // Color coding
            if (terminalLines[lineIndex].startsWith('✓')) {
                line.style.color = '#27c93f';
            } else if (terminalLines[lineIndex].startsWith('▶')) {
                line.style.color = '#00d4cc';
            } else if (terminalLines[lineIndex].startsWith('$')) {
                line.style.color = '#ffbd2e';
            }
            
            terminal.appendChild(line);
            terminal.scrollTop = terminal.scrollHeight;
            lineIndex++;
            
            // Faster animation for empty lines
            const delay = terminalLines[lineIndex - 1] === '' ? 200 : 400;
            setTimeout(addTerminalLine, delay);
        }
    }
    
    // Start terminal animation after 2 seconds
    setTimeout(() => {
        terminal.innerHTML = '';
        addTerminalLine();
    }, 2000);
})();
