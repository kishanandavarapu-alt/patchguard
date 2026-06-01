const express = require("express");
const router = express.Router();
const supabase = require("../lib/supabase");

router.get("/", async (req, res, next) => {
  const {
    endpoint_id, cve_id, action, status, from, to,
    limit = 50, offset = 0, sort = "created_at", order = "desc",
  } = req.query;

  const parsedLimit  = Math.min(parseInt(limit, 10)  || 50, 200);
  const parsedOffset = parseInt(offset, 10) || 0;

  console.log(`[logs] 📋 GET /api/logs`, {
    filters: { endpoint_id, cve_id, action, status, from, to },
    pagination: { limit: parsedLimit, offset: parsedOffset, sort, order },
  });

  try {
    let query = supabase
      .from("patch_logs")
      .select(
        `
        id,
        endpoint_id,
        cve_id,
        action,
        status,
        rolled_back,
        triggered_by,
        created_at,
        endpoints (
          id,
          hostname,
          ip_address,
          status
        )
        `,
        { count: "exact" }
      )
      .order(sort, { ascending: order === "asc" })
      .range(parsedOffset, parsedOffset + parsedLimit - 1);

    if (endpoint_id) query = query.eq("endpoint_id", endpoint_id);
    if (cve_id)      query = query.ilike("cve_id", `%${cve_id}%`);
    if (action)      query = query.eq("action", action.toLowerCase());
    if (status)      query = query.eq("status", status.toLowerCase());
    if (from)        query = query.gte("created_at", from);
    if (to)          query = query.lte("created_at", to);

    const { data, error, count } = await query;
    if (error) throw error;

    const summary = {
      total_deploys:   data.filter((l) => l.action === "patch_deploy").length,
      total_rollbacks: data.filter((l) => l.action === "rollback").length,
      successful:      data.filter((l) => l.status === "success").length,
      failed:          data.filter((l) => l.status === "failed").length,
    };

    console.log(`[logs] ✅ Returning ${data.length} of ${count} log entries`);

    return res.json({
      data,
      pagination: {
        total: count,
        limit: parsedLimit,
        offset: parsedOffset,
        has_more: parsedOffset + parsedLimit < count,
      },
      summary,
    });
  } catch (err) {
    next(err);
  }
});

router.get("/:id", async (req, res, next) => {
  const { id } = req.params;
  try {
    const { data, error } = await supabase
      .from("patch_logs")
      .select(`*, endpoints(id, hostname, ip_address)`)
      .eq("id", id)
      .single();

    if (error || !data) {
      return res.status(404).json({ error: "Log entry not found", id });
    }
    return res.json(data);
  } catch (err) {
    next(err);
  }
});

module.exports = router;