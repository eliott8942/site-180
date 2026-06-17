#!/usr/bin/env node
/**
 * parse_members.js
 * ----------------
 * Reads a CSV file containing association members (Nom, Prénom, Poste, Mail),
 * determines each person's pole(s) and role type (responsable / membre),
 * builds the special 'Comité' pole automatically, then:
 *   - writes a YAML file listing all poles with their members
 *   - runs verifications (HTTP existence check + local image file check)
 *
 * Expected CSV columns: Nom, Prénom, Poste, Mail
 * The 'Poste' field may contain multiple roles separated by '/'.
 *
 * Usage:  node parse_members.js
 * Deps:   npm install csv-parse js-yaml
 */

'use strict';

const fs    = require('fs');
const path  = require('path');
const https = require('https');
const http  = require('http');
const { parse: csvParse } = require('csv-parse/sync');
const yaml  = require('js-yaml');

// ---------------------------------------------------------------------------
// Configuration  ← edit these values to match your setup
// ---------------------------------------------------------------------------

const YAML_PATH = 'poles.yaml';

/** Year used in image paths (both YAML and local directory). */
const IMAGE_YEAR      = 2025;
/** Base web path written into the YAML → /image/members/2025/<personId> */
const IMAGE_WEB_BASE  = '/image/members';
/** Local filesystem root used for image existence verification. */
const IMAGE_LOCAL_DIR = './image/members';
/** File extensions accepted when checking local images. */
const IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp', 'gif'];

/**
 * Known universities whose members may appear in the CSV.
 * For each shortname "X" the script derives:
 *   email domain  →  X.ch
 *   profile URL   →  https://people.X.ch/<personId>
 * Leave empty [] to skip university-based checks entirely.
 */
const KNOWN_UNIVERSITIES = ['epfl'];

/** Known valid pole names — leave empty [] to skip the pole-name check. */
const VALID_POLES = [
  'IT & Website',
  'Communication',
  'Event',
  'Création',
  'Sponsoring',
];

/**
 * Descriptions for each pole written into the YAML.
 * A validation warning is raised for any detected pole with no entry here.
 */
const POLE_DESCRIPTIONS = {
  'Comité':        "Organe de direction de l'association",
  'IT & Website':  'Gestion du site web, du Crieur ainsi que du blog',
  'Communication': "Gestion de l'identité visuelle ainsi que les réseaux sociaux de l'association",
  'Event':         'Organisation des événements',
  'Création':      'Création de recettes',
  'Sponsoring':    'Recherche et gestion des sponsors et des partenaires',
};

// ---------------------------------------------------------------------------
// Internal constants
// ---------------------------------------------------------------------------

const COMITE_NAME = 'Comité';

const VALID_ROLE_KEYWORDS = ['responsable', 'membre'];

const SPECIAL_COMITE_KEYWORDS = [
  'président', 'president',
  'vice-président', 'vice-president',
  'vice président', 'vice president',
  'trésorier', 'tresorier',
  'trésorière', 'tresoriere',
];

/** Only these grant type: 'chief' inside the Comité pole (not Trésorière). */
const COMITE_CHIEF_KEYWORDS = ['président', 'president'];

const POLE_INDICATORS = ['pôle', 'pole'];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Lowercase, trim, and collapse internal whitespace to a single space. */
function normalize(text) {
  return text.toLowerCase().trim().replace(/\s+/g, ' ');
}

/** True for roles that auto-place the person in the Comité. */
function isSpecialComiteRole(roleText) {
  const n = normalize(roleText);
  return SPECIAL_COMITE_KEYWORDS.some(kw => n.includes(kw));
}

/** True only for Président / Vice-Président (decides type: chief in Comité). */
function isComiteChief(roleText) {
  const n = normalize(roleText);
  return COMITE_CHIEF_KEYWORDS.some(kw => n.includes(kw));
}

/**
 * Extract the pole name from a role string.
 *
 * Two formats supported:
 *   'Responsable Pôle Informatique'  →  'Informatique'   (with Pôle keyword)
 *   'Membre Communication'           →  'Communication'  (without Pôle keyword)
 *
 * Returns null when nothing useful can be extracted.
 */
function extractPoleName(roleText) {
  const lower = roleText.toLowerCase();

  // Primary: explicit Pôle / Pole indicator
  for (const indicator of POLE_INDICATORS) {
    const idx = lower.indexOf(indicator);
    if (idx !== -1) {
      const name = roleText.slice(idx + indicator.length).trim();
      return name || null;
    }
  }

  // Fallback: strip the leading role keyword
  for (const kw of VALID_ROLE_KEYWORDS) {
    if (lower.startsWith(kw)) {
      const name = roleText.slice(kw.length).trim();
      return name || null;
    }
  }

  return null;
}

/** Web image path written into the YAML. */
function imageWebPath(personId) {
  return `${IMAGE_WEB_BASE}/${IMAGE_YEAR}/${personId}`;
}

/**
 * Return the university shortname matching the email domain, or null.
 * e.g.  'jean.dupont@epfl.ch'  →  'epfl'
 */
function getUniversity(email) {
  if (!email.includes('@')) return null;
  const domain = email.split('@').pop().trim().toLowerCase();
  return KNOWN_UNIVERSITIES.find(u => domain === `${u}.ch`) ?? null;
}

/** People-directory URL for the given university and personId. */
function peopleUrl(personId, university) {
  return `https://people.${university}.ch/${personId}`;
}

/**
 * Look for IMAGE_LOCAL_DIR/<IMAGE_YEAR>/<personId>.<ext>.
 * Returns the first matching path, or null.
 */
function findLocalImage(personId) {
  const baseDir = path.join(IMAGE_LOCAL_DIR, String(IMAGE_YEAR));
  for (const ext of IMAGE_EXTENSIONS) {
    const filePath = path.join(baseDir, `${personId}.${ext}`);
    if (fs.existsSync(filePath)) return filePath;
  }
  return null;
}

/**
 * Strip diacritics / accents using Unicode NFD decomposition.
 * e.g. 'Léa' → 'Lea', 'François' → 'Francois'
 */
function stripAccents(text) {
  return text.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

/**
 * Build a normalized personId from first and last name.
 * Format: prenom.nom (lowercase, accents removed, spaces → hyphens)
 * e.g. 'Léa' + 'Nguyen'       → 'lea.nguyen'
 *      'Jean-Marie' + 'De La Tour' → 'jean-marie.de-la-tour'
 */
function makePersonId(email) {
  return extractEmailUsername(email)
}

function extractEmailUsername(email) {
  if (!email || typeof email !== 'string') {
    return null;
  }
  
  const atIndex = email.indexOf('@');
  
  if (atIndex === -1 || atIndex === 0) {
    return null; // Invalid email format
  }
  
  return email.substring(0, atIndex);
}

// ---------------------------------------------------------------------------
// HTTP check
// ---------------------------------------------------------------------------

/** HEAD request to url. Returns { ok: bool, status: number|string }. */
function checkHttp(url) {
  return new Promise(resolve => {
    const lib = url.startsWith('https') ? https : http;
    const req = lib.request(url, { method: 'HEAD', timeout: 5000 }, res => {
      res.resume(); // drain the response
      const ok = res.statusCode >= 200 && res.statusCode < 400;
      resolve({ ok, status: res.statusCode });
    });
    req.on('timeout', () => { req.destroy(); resolve({ ok: false, status: 'TIMEOUT' }); });
    req.on('error',   err => resolve({ ok: false, status: err.message }));
    req.end();
  });
}

// ---------------------------------------------------------------------------
// Parsing
// ---------------------------------------------------------------------------

/**
 * Parse one raw CSV row into a structured person object.
 *
 * @returns {{
 *   nom, prenom, mail,
 *   personId   – normalized from prenom + nom (no accents, lowercase, prenom.nom),
 *   university – shortname e.g. 'epfl', or null,
 *   poles      – array of pole names,
 *   roleTypes  – parallel array of 'responsable' | 'membre',
 *   roles      – array of { poleName, roleText, roleType },
 *   rawPostes  – original slash-split segments (used for validation),
 * }}
 */
function parsePersonRow(row) {
  const nom      = (row['Nom']    ?? '').trim();
  const prenom   = (row['Prénom'] ?? '').trim();
  const mail     = (row['Mail']   ?? '').trim();
  const posteStr = (row['Poste']  ?? '').trim();

  const personId   = makePersonId(mail);
  const university = getUniversity(mail);

  const rawRoles = posteStr
    .split('/')
    .map(r => r.trim().replace(/\s+/g, ' '))
    .filter(r => r.length > 0);

  /** @type {{ poleName: string, roleText: string, roleType: string }[]} */
  const personRoles = [];
  let inComite        = false;
  let comiteRoleText  = null;

  for (const roleText of rawRoles) {
    if (isSpecialComiteRole(roleText)) {
      personRoles.push({ poleName: COMITE_NAME, roleText, roleType: 'responsable' });
      inComite = true;
      if (!comiteRoleText) comiteRoleText = roleText;
    } else {
      const poleName = extractPoleName(roleText);
      if (poleName) {
        const roleType = normalize(roleText).includes('responsable') ? 'responsable' : 'membre';
        personRoles.push({ poleName, roleText, roleType });
        if (roleType === 'responsable' && !inComite) {
          inComite       = true;
          comiteRoleText = roleText;
        }
      }
    }
  }

  const alreadyInComite = personRoles.some(r => r.poleName === COMITE_NAME);
  if (inComite && !alreadyInComite && comiteRoleText) {
    personRoles.push({ poleName: COMITE_NAME, roleText: comiteRoleText, roleType: 'responsable' });
  }

  return {
    nom,
    prenom,
    mail,
    personId,
    university,
    poles:     personRoles.map(r => r.poleName),
    roleTypes: personRoles.map(r => r.roleType),
    roles:     personRoles,
    rawPostes: rawRoles,
  };
}

/** Read the CSV file and return raw rows (no parsing). */
function readCsv(filepath) {
  const content = fs.readFileSync(filepath, 'utf-8');
  return csvParse(content, { columns: true, skip_empty_lines: true, trim: true });
}

/** Parse raw rows into person objects, skipping rows with no Mail. */
function parseRows(rawRows) {
  return rawRows
    .filter(row => (row['Mail'] ?? '').trim().length > 0)
    .map(parsePersonRow);
}

// ---------------------------------------------------------------------------
// YAML generation
// ---------------------------------------------------------------------------

/**
 * Aggregate persons by pole and build the YAML-ready object.
 *
 * Comité rules:
 *   • Appears FIRST.
 *   • type: 'chief' → only Président / Vice-Président.
 *   • image → ALL Comité members, only if local file exists.
 *
 * Regular pole rules:
 *   • type: 'chief' + image → responsables only (image only if file exists).
 *
 * Description is taken from POLE_DESCRIPTIONS, falls back to 'description'.
 */
function buildYamlStructure(persons) {
  /** @type {Map<string, object[]>} */
  const polesDict = new Map();

  for (const person of persons) {
    const seen = new Set();
    for (const { poleName, roleText, roleType } of person.roles) {
      const key = `${person.personId}::${poleName}`;
      if (seen.has(key)) continue;
      seen.add(key);

      const entry = {
        name: `${person.prenom} ${person.nom}`,
        role: roleText,
      };

      if (poleName === COMITE_NAME) {
        if (isComiteChief(roleText))         entry.type  = 'chief';
        if (findLocalImage(person.personId)) entry.image = imageWebPath(person.personId);
      } else if (roleType === 'responsable') {
        entry.type = 'chief';
        if (findLocalImage(person.personId)) entry.image = imageWebPath(person.personId);
      }

      if (!polesDict.has(poleName)) polesDict.set(poleName, []);
      polesDict.get(poleName).push(entry);
    }
  }

  // Comité first, then remaining poles alphabetically
  const sortedNames = [...polesDict.keys()].sort((a, b) => {
    if (a === COMITE_NAME) return -1;
    if (b === COMITE_NAME) return  1;
    return a.toLowerCase().localeCompare(b.toLowerCase());
  });

  const poles = sortedNames.map(poleName => {
    const pole = {
      name:        poleName,
      description: POLE_DESCRIPTIONS[poleName] ?? 'description',
    };
    if (poleName === COMITE_NAME) pole.theme = 'comity';
    pole.members = polesDict.get(poleName);
    return pole;
  });

  return { poles };
}

/** Serialise the data object to a YAML file. */
function writeYaml(data, outputPath) {
  const content = yaml.dump(data, { allowUnicode: true, sortKeys: false, lineWidth: -1 });
  fs.writeFileSync(outputPath, content, 'utf-8');
  console.log(`YAML written → '${outputPath}'\n`);
}

// ---------------------------------------------------------------------------
// Validations
// ---------------------------------------------------------------------------

const SEP = '─'.repeat(60);

/**
 * Check that every CSV row has all required fields with valid values.
 * Returns true when at least one *error* was found.
 */
function runFieldValidations(rawRows) {
  console.log(`\n${SEP}`);
  console.log('  Data Validation — Required Fields');
  console.log(SEP);

  const REQUIRED = ['Nom', 'Prénom', 'Mail', 'Poste'];
  const errors   = [];

  rawRows.forEach((row, i) => {
    const nom    = (row['Nom']    ?? '').trim();
    const prenom = (row['Prénom'] ?? '').trim();
    const label  = `Row ${i + 1} (${prenom || '?'} ${nom || '?'})`;

    for (const field of REQUIRED) {
      const value = (row[field] ?? '').trim();
      if (!value) {
        const msg = `${label}: '${field}' is empty or missing`;
        console.log(`  ✗  ${msg}`);
        errors.push(msg);
        continue;
      }
      if (field === 'Mail') {
        const parts = value.split('@');
        if (parts.length !== 2 || !parts[0].trim() || !parts[1].trim()) {
          const msg = `${label}: 'Mail' has invalid format: '${value}'`;
          console.log(`  ✗  ${msg}`);
          errors.push(msg);
        } else if (KNOWN_UNIVERSITIES.length > 0 && getUniversity(value) === null) {
          const known = KNOWN_UNIVERSITIES.map(u => `${u}.ch`).join(', ');
          console.log(
            `  ⚠  ${label}: email domain '${parts[1].trim()}' is not a ` +
            `known university domain (${known}) — person_id may be unreliable`
          );
        }
      }
    }
  });

  if (errors.length > 0) console.log(`\n  ⚠  ${errors.length} field error(s) found.`);
  else                    console.log('  ✓  All required fields are present and valid.');

  return errors.length > 0;
}

/** Check a single role segment. Returns { ok, msg }. */
function validateRoleSegment(roleText) {
  if (isSpecialComiteRole(roleText)) return { ok: true, msg: null };

  const n = normalize(roleText);
  if (!VALID_ROLE_KEYWORDS.some(kw => n.startsWith(kw))) {
    return {
      ok:  false,
      msg: `unknown role keyword (expected to start with one of: ` +
           `${VALID_ROLE_KEYWORDS.join(' | ')}, ` +
           `or be a special role like Président / Trésorière)`,
    };
  }
  if (!extractPoleName(roleText)) {
    return { ok: false, msg: 'role keyword found but no pole name follows' };
  }
  return { ok: true, msg: null };
}

/** Check a pole name against VALID_POLES. Returns { ok, msg }. */
function validatePoleName(poleName) {
  if (VALID_POLES.length === 0) return { ok: true, msg: null };
  if (!VALID_POLES.some(v => normalize(poleName) === normalize(v))) {
    return { ok: false, msg: `not listed in VALID_POLES  (known: ${VALID_POLES.join(', ')})` };
  }
  return { ok: true, msg: null };
}

/**
 * Run all four data checks:
 *   1 – Role validity
 *   2 – Pole existence
 *   3 – Pole structure (≥1 responsable per pole)
 *   4 – Pole descriptions
 */
function runDataValidations(persons) {
  // ── Check 1: role validity ─────────────────────────────────────────────────
  console.log(`\n${SEP}`);
  console.log('  Data Validation — Role Check');
  console.log(SEP);

  const roleErrors = [];
  for (const p of persons) {
    const label = `${p.prenom} ${p.nom} (${p.personId})`;
    for (const raw of p.rawPostes) {
      const { ok, msg } = validateRoleSegment(raw);
      if (!ok) {
        console.log(`  ✗  ${label}  →  '${raw}'`);
        console.log(`       ↳ ${msg}`);
        roleErrors.push(`${label}: '${raw}' — ${msg}`);
      }
    }
  }
  if (roleErrors.length > 0) console.log(`\n  ⚠  ${roleErrors.length} invalid role segment(s).`);
  else                        console.log('  ✓  All role segments are valid.');

  // ── Check 2: pole existence ────────────────────────────────────────────────
  console.log(`\n${SEP}`);
  if (VALID_POLES.length === 0) {
    console.log('  Data Validation — Pole Check  [SKIPPED — VALID_POLES is empty]');
  } else {
    console.log(`  Data Validation — Pole Check  (known: ${VALID_POLES.join(', ')})`);
    console.log(SEP);

    const poleErrors = [];
    const seenPoles  = new Set();
    for (const p of persons) {
      for (const { poleName } of p.roles) {
        if (poleName === COMITE_NAME || seenPoles.has(poleName)) continue;
        seenPoles.add(poleName);
        const { ok, msg } = validatePoleName(poleName);
        if (!ok) {
          console.log(`  ✗  Pôle '${poleName}'  →  ${msg}`);
          poleErrors.push(msg);
        }
      }
    }
    if (poleErrors.length > 0) console.log(`\n  ⚠  ${poleErrors.length} unknown pole(s).`);
    else                        console.log('  ✓  All poles are recognised.');
  }

  // ── Check 3: pole structure ────────────────────────────────────────────────
  console.log(`\n${SEP}`);
  console.log('  Data Validation — Pole Structure (≥1 responsable per pole)');
  console.log(SEP);

  /** @type {Map<string, string[]>} */
  const poleResponsables = new Map();
  const allPoles         = new Set();

  for (const p of persons) {
    for (const { poleName, roleType } of p.roles) {
      if (poleName === COMITE_NAME) continue;
      allPoles.add(poleName);
      if (roleType === 'responsable') {
        if (!poleResponsables.has(poleName)) poleResponsables.set(poleName, []);
        poleResponsables.get(poleName).push(`${p.prenom} ${p.nom}`);
      }
    }
  }

  const structErrors = [];
  for (const poleName of [...allPoles].sort()) {
    if (!poleResponsables.get(poleName)?.length) {
      const line = `  ✗  Pôle '${poleName}': no responsable assigned`;
      console.log(line);
      structErrors.push(line.trim());
    }
  }
  if (structErrors.length > 0) console.log(`\n  ⚠  ${structErrors.length} pole(s) with no responsable.`);
  else                          console.log('  ✓  All poles have at least one responsable.');

  // ── Check 4: pole descriptions ─────────────────────────────────────────────
  console.log(`\n${SEP}`);
  console.log('  Data Validation — Pole Descriptions');
  console.log(SEP);

  const hasComite = persons.some(p => p.roles.some(r => r.poleName === COMITE_NAME));
  const allPolesWithComite = new Set(allPoles);
  if (hasComite) allPolesWithComite.add(COMITE_NAME);

  const descErrors = [];
  for (const poleName of [...allPolesWithComite].sort()) {
    if (!(poleName in POLE_DESCRIPTIONS)) {
      const line = `  ✗  Pôle '${poleName}': no entry in POLE_DESCRIPTIONS`;
      console.log(line);
      descErrors.push(line.trim());
    }
  }
  if (descErrors.length > 0) console.log(`\n  ⚠  ${descErrors.length} pole(s) missing a description.`);
  else                        console.log('  ✓  All poles have a description.');

  console.log();
}

// ---------------------------------------------------------------------------
// HTTP & image verifications
// ---------------------------------------------------------------------------

/** Set of personIds that must have a local image (Comité members + responsables). */
function collectImageRequired(persons) {
  const needs = new Set();
  for (const person of persons) {
    for (const { poleName, roleType } of person.roles) {
      if (poleName === COMITE_NAME || roleType === 'responsable') {
        needs.add(person.personId);
      }
    }
  }
  return needs;
}

async function runVerifications(persons) {
  // ── 1. HTTP existence ───────────────────────────────────────────────────────
  console.log(`\n${SEP}`);
  console.log('  HTTP Existence Check  (people.<university>.ch/<personId>)');
  console.log(SEP);

  const httpErrors = [];
  for (const p of persons) {
    const name = `${p.prenom} ${p.nom}`;
    if (!p.university) {
      const known = KNOWN_UNIVERSITIES.map(u => `${u}.ch`).join(', ');
      console.log(`  ⚠  ${name} (${p.personId})  →  SKIPPED (domain not in [${known}])`);
      continue;
    }
    const url = peopleUrl(p.personId, p.university);
    const { ok, status } = await checkHttp(url);
    if (!ok) {
      const label = typeof status === 'number' ? `HTTP ${status}` : `ERROR – ${status}`;
      const line  = `  ✗  ${name} (${p.personId})  →  ${url}  →  ${label}`;
      console.log(line);
      httpErrors.push(line.trim());
    }
  }
  if (httpErrors.length === 0) {
    console.log('  ✓  All members with a known university are reachable.');
  }

  // ── 2. Image file check ─────────────────────────────────────────────────────
  const imageDir  = path.join(IMAGE_LOCAL_DIR, String(IMAGE_YEAR));
  console.log(`\n${SEP}`);
  console.log(`  Image File Check  (${imageDir}/<personId>.[ext])`);
  console.log(SEP);

  const needsImage = collectImageRequired(persons);
  const missing    = [];
  for (const p of persons) {
    if (!needsImage.has(p.personId)) continue;
    if (!findLocalImage(p.personId)) {
      const line = `  ✗  ${p.prenom} ${p.nom} (${p.personId})  →  MISSING (no image entry in YAML)`;
      console.log(line);
      missing.push(line.trim());
    }
  }
  if (missing.length === 0) {
    console.log('  ✓  All required images are present.');
  }

  console.log();
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const args = process.argv.slice(2);
  
  // Check if at least one argument is provided
  if (args.length === 0) {
    console.error('Usage: updateMembersList.js <member list csv path>');
    process.exit(1); // Exit with failure code
  }
  
  const csv_path = args[0];
  
  // Step 1 – read raw rows
  const rawRows = readCsv(csv_path);

  // Step 2 – validate required fields (before any processing)
  runFieldValidations(rawRows);

  // Step 3 – parse into structured objects
  const persons = parseRows(rawRows);

  // Step 4 – validate role names, pole names, structure, and descriptions
  runDataValidations(persons);

  // Step 5 – generate YAML (image entries only written when file exists)
  const yamlData = buildYamlStructure(persons);
  writeYaml(yamlData, YAML_PATH);

  // Step 6 – HTTP existence + local image checks
  await runVerifications(persons);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});