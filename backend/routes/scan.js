const express = require("express");
const router = express.Router();
const supabase = require("../lib/supabase");

const NVD_BASE = "https://services.nvd.nist.gov/rest/json/cves/2.0";
const NVD_DELAY_MS = 600;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function fetchCVEsFromNVD(keyword) {
  const params = new URLSearchParams({ keywordSearch: keyword });
  const headers = { Accept: "application/json" };
  if (process.env.NVD_API_KEY) {
    headers["apiKey"] = process.env.NVD_API_KEY;
  }

  const url = `${NVD_BASE}?${params.toString()}`;
  console.log(`[scan/nvd] 🔍 Querying NVD for "${keyword}" → ${url}`);

  const resp = await fetch(url, { headers });
  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`NVD API error ${resp.status}: ${text.slice(0, 200)}`);
  }

  const data = await resp.json();
  const total = data.totalResults || 0;
  console.log(`[scan/nvd] ↩  Found ${total} CVE(s) for "${keyword}"`);

  return (data.vulnerabilities || []).map(({ cve }) => {
    const metrics = cve.metrics || {};
    const cvssV3 =
      metrics.cvssMetricV31?.[0]?.cvssData ||
      metrics.cvssMetricV30?.[0]?.cvssData;
    const cvssV2 = metrics.cvssMetricV2?.[0]?.cvssData;

    const severity = cvssV3?.baseSeverity || cvssV2?.baseSeverity || "UNKNOWN";
    const score = cvssV3?.baseScore ?? cvssV2?.baseScore ?? null;

    const description =
      cve.descriptions?.find((d) => d.lang === "en")?.value ||
      "No description available.";

    return {
      cve_id: cve.id,
      description: description.slice(0, 1000),
      severity: severity.toUpperCase(),
      cvss_score: score,
      published: cve.published,
      last_modified: cve.lastModified,
      nvd_url: `https://nvd.nist.gov/vuln/detail/${cve.id}`,
    };
  });
}

// ─── POST /api/scan ───────────────────────────────────────────────────────────
router.post("/", async (req, res, next) => {
  const { endpoint_id } = req.body;

  if (!endpoint_id) {
    return res.status(400).json({ error: "endpoint_id is required" });
  }

  console.log(`\n[scan] 🚦 Starting scan for endpoint_id="${endpoint_id}"`);

  try {
    // 1. Verify endpoint exists
    const { data: endpoint, error: epErr } = await supabase
      .from("endpoints")
      .select("id, hostname, ip_address")
      .eq("id", endpoint_id)
      .single();

    if (epErr || !endpoint) {
      console.warn(`[scan] ⚠️  Endpoint ${endpoint_id} not found`);
      return res.status(404).json({ error: "Endpoint not found", endpoint_id });
    }
    console.log(`[scan] ✅ Endpoint found: ${endpoint.hostname} (${endpoint.ip_address})`);

    // 2. Fetch installed software for this endpoint
    const { data: software, error: swErr } = await supabase
      .from("software")
      .select("id, name, installed_version")
      .eq("endpoint_id", endpoint_id);

    if (swErr) throw swErr;
    console.log(`[scan] 📦 Found ${software.length} software package(s) to check`);

    if (software.length === 0) {
      return res.json({
        message: "No software found for this endpoint",
        endpoint_id,
        cves_found: 0,
        results: [],
      });
    }

    // 3. For each package, query NVD and upsert findings
    const scanResults = [];
    let totalCVEs = 0;

    for (const pkg of software) {
      const keyword = `${pkg.name} ${pkg.installed_version}`.trim();
      console.log(`[scan] 🔎 Checking: ${pkg.name} v${pkg.installed_version}`);

      let cves = [];
      try {
        cves = await fetchCVEsFromNVD(keyword);
      } catch (nvdErr) {
        console.error(`[scan] ❌ NVD fetch failed for "${keyword}":`, nvdErr.message);
        scanResults.push({ software_id: pkg.id, name: keyword, error: nvdErr.message });
        await sleep(NVD_DELAY_MS);
        continue;
      }

      // 4. Upsert each CVE into vulnerabilities table
      for (const cve of cves) {
        const record = {
          software_id: pkg.id,
          cve_id: cve.cve_id,
          description: cve.description,
          severity: cve.severity.toLowerCase(),
          cvss_score: cve.cvss_score,
          patch_available: true,
        };

        const { error: upsertErr } = await supabase
          .from("vulnerabilities")
          .upsert(record, { onConflict: "cve_id" });

        if (upsertErr) {
          console.error(`[scan] ❌ Failed to save ${cve.cve_id}:`, upsertErr.message);
        } else {
          console.log(`[scan] 💾 Saved ${cve.cve_id} (${cve.severity}, CVSS ${cve.cvss_score})`);
          totalCVEs++;
        }
      }

      scanResults.push({
        software_id: pkg.id,
        name: keyword,
        cves_found: cves.length,
        cve_ids: cves.map((c) => c.cve_id),
      });

      await sleep(NVD_DELAY_MS);
    }

    // 5. Update endpoint last_scanned timestamp
    await supabase
      .from("endpoints")
      .update({ last_scanned: new Date().toISOString() })
      .eq("id", endpoint_id);

    console.log(`[scan] ✅ Scan complete — ${totalCVEs} CVE(s) saved\n`);

    return res.json({
      message: "Scan complete",
      endpoint_id,
      endpoint_name: endpoint.hostname,
      packages_scanned: software.length,
      cves_found: totalCVEs,
      results: scanResults,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;