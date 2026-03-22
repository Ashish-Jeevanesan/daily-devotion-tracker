import { serve } from "https://deno.land/std/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js";

const allowedOrigins = new Set([
  "http://localhost:4200",
  "https://daily-devotion-tracker.vercel.app",
]);
const RUN_USER_REPORT_JOB_ACCESS = "run_user_report_job";

function getCorsHeaders(origin: string | null) {
  const allowedOrigin = origin && allowedOrigins.has(origin)
    ? origin
    : "http://localhost:4200";

  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };
}

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req.headers.get("origin"));

  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: corsHeaders,
    });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const brevoApiKey = Deno.env.get("BREVO_API_KEY");
  const authorizationHeader = req.headers.get("Authorization");
  const requestApiKey = req.headers.get("apikey");

  console.log("[monthly-report] secret presence", {
    hasSupabaseUrl: !!supabaseUrl,
    hasSupabaseServiceRoleKey: !!supabaseServiceRoleKey,
    hasBrevoApiKey: !!brevoApiKey,
    hasAuthorizationHeader: !!authorizationHeader,
    hasRequestApiKey: !!requestApiKey,
  });

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    console.error("[monthly-report] missing required Supabase secrets");
    return new Response(JSON.stringify({
      ok: false,
      message: "Missing Supabase function secrets."
    }), {
      status: 500,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
    });
  }

  if (!authorizationHeader?.startsWith("Bearer ")) {
    console.error("[monthly-report] missing bearer token");
    return new Response(JSON.stringify({
      ok: false,
      message: "Missing authorization token."
    }), {
      status: 401,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
    });
  }

  if (!requestApiKey) {
    console.error("[monthly-report] missing apikey header");
    return new Response(JSON.stringify({
      ok: false,
      message: "Missing project API key."
    }), {
      status: 401,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
    });
  }

  const userSupabase = createClient(
    supabaseUrl,
    requestApiKey,
    {
      global: {
        headers: {
          Authorization: authorizationHeader,
        },
      },
    }
  );

  const { data: authData, error: authError } = await userSupabase.auth.getUser();
  if (authError || !authData.user) {
    console.error("[monthly-report] user auth failed", authError);
    return new Response(JSON.stringify({
      ok: false,
      message: "Invalid user session."
    }), {
      status: 401,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
    });
  }

  console.log("[monthly-report] authenticated user", {
    userId: authData.user.id,
    email: authData.user.email ?? null,
  });

  const supabase = createClient(
    supabaseUrl,
    supabaseServiceRoleKey
  );

  const { data: accessMapping, error: accessError } = await supabase
    .from("profile_access_rules")
    .select(`
      id,
      access_rule:access_rules!inner (
        code,
        is_active
      )
    `)
    .eq("profile_id", authData.user.id)
    .is("void_fl", null)
    .eq("access_rules.code", RUN_USER_REPORT_JOB_ACCESS)
    .eq("access_rules.is_active", true)
    .limit(1)
    .maybeSingle();

  if (accessError) {
    console.error("[monthly-report] access lookup failed", accessError);
    return new Response(JSON.stringify({
      ok: false,
      message: "Unable to verify access."
    }), {
      status: 500,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
    });
  }

  if (!accessMapping) {
    console.error("[monthly-report] access denied", {
      userId: authData.user.id,
      requiredAccess: RUN_USER_REPORT_JOB_ACCESS,
    });
    return new Response(JSON.stringify({
      ok: false,
      message: "You do not have access to run this report job."
    }), {
      status: 403,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
    });
  }

  console.log("[monthly-report] access granted", {
    userId: authData.user.id,
    requiredAccess: RUN_USER_REPORT_JOB_ACCESS,
  });

  const TEST_EMAIL = "ashishjwork09@gmail.com";
  const IS_TEST_MODE = true;
  // 📊 Logging counters
  let totalUsers = 0;
  let processedUsers = 0;
  let sentCount = 0;
  let skippedCount = 0;
  let errorCount = 0;
  const template = `
            <div style="margin:0;padding:0;background-color:#f5f7fb;font-family:Arial,sans-serif;">
              <table width="100%" cellpadding="0" cellspacing="0" style="padding:20px 0;">
                <tr>
                  <td align="center">

                    <!-- Main Container -->
                    <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.05);">

                      <!-- Header -->
                      <tr>
                        <td style="background:linear-gradient(135deg,#6a11cb,#2575fc);padding:30px;text-align:center;color:white;">
                          <h1 style="margin:0;font-size:22px;">🙏 Daily Devotion Tracker</h1>
                          <p style="margin:5px 0 0;font-size:14px;opacity:0.9;">
                            Your Monthly Spiritual Report
                          </p>
                        </td>
                      </tr>

                      <!-- Greeting -->
                      <tr>
                        <td style="padding:25px 30px;">
                          <p style="margin:0;font-size:16px;color:#333;">
                            Hi <strong style="color:#2575fc;">{{name}}</strong>,
                          </p>
                          <p style="margin:10px 0 0;font-size:15px;color:#555;">
                            Here's your devotion summary for the period below:
                          </p>

                          <p style="margin:5px 0 0;font-size:14px;color:#777;">
                            📅 {{startDate}} → {{endDate}}
                          </p>

                          <p style="margin:10px 0 0;font-size:15px;color:#555;">
                            Keep walking faithfully 🙏
                          </p>
                        </td>
                      </tr>

                      <!-- Stats Section -->
                      <tr>
                        <td style="padding:10px 30px 30px;">
                          <table width="100%" cellpadding="0" cellspacing="0">

                            <tr>
                              <td width="33%" align="center" style="padding:15px;">
                                <div style="background:#f0f7ff;border-radius:10px;padding:15px;">
                                  <p style="margin:0;font-size:22px;font-weight:bold;color:#2575fc;">
                                    {{completedDays}}
                                  </p>
                                  <p style="margin:5px 0 0;font-size:13px;color:#666;">
                                    Days Completed
                                  </p>
                                </div>
                              </td>

                              <td width="33%" align="center" style="padding:15px;">
                                <div style="background:#fff4f4;border-radius:10px;padding:15px;">
                                  <p style="margin:0;font-size:22px;font-weight:bold;color:#ff4d4f;">
                                    {{missedDays}}
                                  </p>
                                  <p style="margin:5px 0 0;font-size:13px;color:#666;">
                                    Missed Days
                                  </p>
                                </div>
                              </td>

                              <td width="33%" align="center" style="padding:15px;">
                                <div style="background:#f6fff5;border-radius:10px;padding:15px;">
                                  <p style="margin:0;font-size:22px;font-weight:bold;color:#28a745;">
                                    {{percentage}}%
                                  </p>
                                  <p style="margin:5px 0 0;font-size:13px;color:#666;">
                                    Completion
                                  </p>
                                </div>
                              </td>
                            </tr>

                          </table>
                        </td>
                      </tr>

                      <!-- Encouragement Section -->
                      <tr>
                        <td style="padding:0 30px 30px;">
                          <div style="background:#fafafa;border-left:4px solid #2575fc;padding:15px;border-radius:6px;">
                            <p style="margin:0;font-size:14px;color:#444;">
                              💡 <strong>Encouragement:</strong><br/>
                              {{encouragementMessage}}
                            </p>
                          </div>
                        </td>
                      </tr>

                      <!-- CTA -->
                      <tr>
                        <td align="center" style="padding:0 30px 30px;">
                          <a href="{{appLink}}" 
                            style="display:inline-block;padding:12px 24px;background:#2575fc;color:white;text-decoration:none;border-radius:8px;font-size:14px;">
                            Open Devotion Tracker
                          </a>
                        </td>
                      </tr>

                      <!-- Footer -->
                      <tr>
                        <td style="background:#f9fafc;padding:20px;text-align:center;">
                          <p style="margin:0;font-size:12px;color:#999;">
                            Grace & peace,<br/>
                            Daily Devotion Tracker
                          </p>
                        </td>
                      </tr>

                    </table>

                  </td>
                </tr>
              </table>
            </div>
    `;

  try {
    const { data: usersData, error: usersError } =
      await supabase.auth.admin.listUsers();

    if (usersError) throw usersError;

    const users = usersData.users;
    totalUsers = users.length;

    console.log(`🚀 Monthly report started. Total users: ${totalUsers}`);

    for (const user of users) {
      if (!user.email) {
        skippedCount++;
        continue;
      }

      // 🔒 TEST MODE (remove later)
      if (user.email !== "rencewigg@gmail.com") {
        skippedCount++;
        continue;
      }

      processedUsers++;

      try {
        //Fetching the User name for mail.
        const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("full_name, username, report_preference, last_mail_sent")
        .eq("id", user.id)
        .is("void_fl", null)
        .single();

        if (profileError) {
          console.error(`⚠️ Profile not found for ${user.email}`);
        }

        console.log("profile--> ",profile);
        const name =  profile?.full_name ||  profile?.username ||  user.email ||  "User";
        console.log("User name for Mail --> "+name);
        const frequency = profile?.report_preference || "MONTHLY";
        console.log("frequency--> "+frequency);

        const lastSentAt = profile?.last_mail_sent
            ? new Date(profile.last_mail_sent)
            : null;
        const now = new Date();
        // 🚫 Skip if already sent for this period
        if (lastSentAt && isSamePeriod(lastSentAt, now, frequency)) {
          console.log(`⏭ Already sent for ${user.email}`);
          skippedCount++;
          continue;
        }

        // 📅 Range being set based on the profile frequency.
        let range;
        if (frequency === "WEEKLY") {
          range = getLastWeekRange();
        } else {
          range = getLastMonthRange();
        }
        // Setting up subject for mail dynamically based on the frequency 
        const subject =
        frequency === "WEEKLY"
          ? `Your Weekly Devotion Report (${range.start.toDateString()} - ${range.end.toDateString()})`
          : `Your Monthly Devotion Report`;

        const { data: devotions, error } = await supabase
          .from("devotions")
          .select("id")
          .eq("user_id", user.id)
          .gte("created_at", range.start.toISOString())
          .lte("created_at", range.end.toISOString());

        if (error) throw error;

        if (!devotions || devotions.length === 0) {
          console.log(`⏭ Skipping ${user.email} (no devotions)`);
          skippedCount++;
          continue;
        }

        // 📊 Metrics
        const totalDays = frequency === "WEEKLY" ? 7 : range.end.getDate();
        const completedDays = devotions.length;
        const percentageNum = (completedDays / totalDays) * 100;
        const percentage = percentageNum.toFixed(1);
        const recipient = IS_TEST_MODE ? TEST_EMAIL : user.email;

        // Replacing the metrics with the data 
        const html = template
          .replaceAll("{{name}}", name)
          .replaceAll("{{completedDays}}", `${completedDays}`)
          .replaceAll("{{missedDays}}", `${totalDays - completedDays}`)
          .replaceAll("{{percentage}}", `${percentage}`)
          .replaceAll("{{appLink}}", "https://daily-devotion-tracker.vercel.app/")
          .replaceAll("{{encouragementMessage}}", getEncouragement(percentageNum))
          .replaceAll("{{startDate}}", range.start.toDateString())
          .replaceAll("{{endDate}}", range.end.toDateString());

        // ✉️ Send Email via Brevo API
        const res = await fetch("https://api.brevo.com/v3/smtp/email", {
          method: "POST",
          headers: {
            "accept": "application/json",
            "api-key": Deno.env.get("BREVO_API_KEY")!,
            "content-type": "application/json",
          },
          body: JSON.stringify({
            sender: {
              name: "Daily Devotion",
              email: "ashishjwork09@gmail.com", // ⚠️ must be verified in Brevo
            },
            to: [{ email: recipient }],
            subject: subject,
            htmlContent: html,
          }),
        });

        if (!res.ok) {
          const errText = await res.text();
          throw new Error(`Brevo API error: ${errText}`);
        }

        sentCount++;
        console.log(`✅ Email sent to: ${recipient}`);
        await supabase
        .from("profiles")
        .update({ last_mail_sent: new Date().toISOString() })
        .eq("id", user.id);
      } catch (userError) {
        errorCount++;
        console.error(`❌ Failed for ${user.email}`, userError);
      }
    }

    // 📊 FINAL SUMMARY
    const summary = {
      totalUsers,
      processedUsers,
      sentCount,
      skippedCount,
      errorCount,
    };

    console.log("📊 Monthly Report Summary:", summary);

    return new Response(JSON.stringify({ ok: true, summary }), {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
    });
  } catch (err) {
    console.error("🔥 Fatal monthly report error:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
    });
  }
});
// Function to get Encouragement preset based on the percentage
function getEncouragement(percentage) {
  if (percentage >= 80)
    return "Amazing consistency! You're growing strong in faith 🙌";
  if (percentage >= 50)
    return "You're doing well! Stay consistent and keep seeking 🙏";
  return "Every step matters. Let's grow stronger this month 💪";
};
// Function to Week range for WEEKLY report 
function getLastWeekRange() {
  const now = new Date();

  const day = now.getDay(); // 0 (Sun) → 6 (Sat)

  // Go back to last Saturday
  const lastSaturday = new Date(now);
  lastSaturday.setDate(now.getDate() - (day === 6 ? 7 : day + 1));

  const lastSunday = new Date(lastSaturday);
  lastSunday.setDate(lastSaturday.getDate() - 6);

  return {
    start: lastSunday,
    end: lastSaturday,
  };
};
// Function to Week range for MONTHLY report 
function getLastMonthRange() {
  const now = new Date();

  const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const end = new Date(now.getFullYear(), now.getMonth(), 0);

  return { start, end };
};
function isSamePeriod(lastSent: Date, now: Date, frequency: string) {
  if (frequency === "WEEKLY") {
    const lastWeek = getLastWeekRangeFromDate(lastSent);
    const currentWeek = getLastWeekRange();

    return (
      lastWeek.start.toDateString() === currentWeek.start.toDateString()
    );
  }

  // MONTHLY (robust)
  const lastMonthRange = getLastMonthRange();

  return (
    lastSent >= lastMonthRange.start &&
    lastSent <= lastMonthRange.end
  );
};
function getLastWeekRangeFromDate(date: Date) {
  const day = date.getDay();

  const lastSaturday = new Date(date);
  lastSaturday.setDate(date.getDate() - (day === 6 ? 7 : day + 1));

  const lastSunday = new Date(lastSaturday);
  lastSunday.setDate(lastSaturday.getDate() - 6);

  return {
    start: lastSunday,
    end: lastSaturday,
  };
}
