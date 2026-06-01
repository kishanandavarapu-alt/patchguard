const express = require("express");
const router = express.Router();
const supabase = require("../lib/supabase");

router.get("/", async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from("endpoints")
      .select("*")
      .order("created_at", { ascending: true });

    if (error) throw error;
    console.log(`[endpoints] ✅ Returning ${data.length} endpoints`);
    return res.json({ data });
  } catch (err) {
    next(err);
  }
});

module.exports = router;