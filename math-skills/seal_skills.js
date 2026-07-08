// WORM Sealing Script for Mathematical Skills
// Seals each skill with SHA-256 hash and Merkle tree

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const skills = [
    'skill1-enumeration',
    'skill2-isomorphism',
    'skill3-symmetry',
    'skill4-hadamard',
    'skill5-probabilistic',
    'skill6-circuits'
];

function hashFile(filePath) {
    const content = fs.readFileSync(filePath);
    return crypto.createHash('sha256').update(content).digest('hex');
}

function sealSkill(skillName) {
    const skillDir = path.join(__dirname, skillName);
    const files = {
        fortran: path.join(skillDir, 'fortran', '*.f90'),
        apl: path.join(skillDir, 'apl', '*.apl'),
        axiom: path.join(skillDir, 'axiom', '*.axiom')
    };
    
    // Hash all files
    const hashes = {};
    for (const [lang, pattern] of Object.entries(files)) {
        const dir = path.dirname(pattern);
        const ext = path.extname(pattern);
        const fileList = fs.readdirSync(dir).filter(f => f.endsWith(ext));
        hashes[lang] = fileList.map(f => hashFile(path.join(dir, f)));
    }
    
    // Create seal
    const sealData = {
        skill: skillName,
        timestamp: new Date().toISOString(),
        hashes: hashes,
        combinedHash: crypto.createHash('sha256')
            .update(JSON.stringify(hashes))
            .digest('hex')
    };
    
    // Write seal
    const sealPath = path.join(__dirname, `${skillName}_seal.json`);
    fs.writeFileSync(sealPath, JSON.stringify(sealData, null, 2));
    
    console.log(`✓ Sealed ${skillName}: ${sealData.combinedHash.substring(0, 16)}...`);
    
    return sealData;
}

function computeMerkleRoot(seals) {
    let hashes = seals.map(s => s.combinedHash);
    
    while (hashes.length > 1) {
        const nextLevel = [];
        for (let i = 0; i < hashes.length; i += 2) {
            const left = hashes[i];
            const right = hashes[i + 1] || left;
            const combined = crypto.createHash('sha256')
                .update(left + right)
                .digest('hex');
            nextLevel.push(combined);
        }
        hashes = nextLevel;
    }
    
    return hashes[0];
}

console.log('===========================================================');
console.log('  WORM Sealing: Mathematical Skills');
console.log('===========================================================');
console.log('');

// Seal all skills
const seals = skills.map(sealSkill);

// Compute Merkle root
const merkleRoot = computeMerkleRoot(seals);

console.log('');
console.log(`Merkle root: ${merkleRoot}`);
console.log('');

// Write master seal
const masterSeal = {
    timestamp: new Date().toISOString(),
    skills: seals,
    merkleRoot: merkleRoot
};

fs.writeFileSync(
    path.join(__dirname, 'math_skills_master_seal.json'),
    JSON.stringify(masterSeal, null, 2)
);

console.log('✓ Master seal written to math_skills_master_seal.json');
console.log('');
console.log('===========================================================');
console.log('  All skills sealed to WORM ledger');
console.log('===========================================================');
