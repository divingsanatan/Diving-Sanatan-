import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/utils/supabaseServer";
import nodemailer from "nodemailer";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { leadId, subject, content, chakraScores } = body;

    if (!leadId || !subject || !content) {
      return NextResponse.json(
        { success: false, error: "Missing required details (leadId, subject, content)" },
        { status: 400 }
      );
    }

    // 1. Fetch user profile
    const { data: profile, error: fetchError } = await supabaseServer
      .from("user_profiles")
      .select("*")
      .eq("id", leadId)
      .single();

    if (fetchError || !profile) {
      return NextResponse.json(
        { success: false, error: "Lead profile not found: " + (fetchError?.message || "") },
        { status: 404 }
      );
    }

    const userEmail = profile.email;
    const userName = profile.name;

    // 2. Setup SMTP transporter
    const smtpHost = process.env.SMTP_HOST || "smtp.gmail.com";
    const smtpPort = Number(process.env.SMTP_PORT) || 587;
    const smtpSecure = process.env.SMTP_SECURE === "true";
    const smtpUser = process.env.SMTP_USER || "";
    const smtpPass = process.env.SMTP_PASS || "";

    let emailSent = false;
    let logMessage = "";

    if (smtpUser && smtpPass) {
      try {
        const transporter = nodemailer.createTransport({
          host: smtpHost,
          port: smtpPort,
          secure: smtpSecure,
          auth: {
            user: smtpUser,
            pass: smtpPass,
          },
        });

        await transporter.sendMail({
          from: `"Diving Sanatan" <${smtpUser}>`,
          to: userEmail,
          subject: subject,
          text: content,
          html: content.replace(/\n/g, "<br/>"),
        });

        emailSent = true;
        logMessage = `Email successfully sent to ${userEmail} via SMTP.`;
      } catch (err: any) {
        console.error("Nodemailer failed, falling back to simulation:", err);
        logMessage = `SMTP send failed: ${err.message}. Report saved in database; email simulated.`;
      }
    } else {
      logMessage = "SMTP credentials missing in .env.local. Email simulation logged to console.";
      console.log(`
========================================================================
[EMAIL SIMULATION] Sending manual Soul Report to user:
------------------------------------------------------------------------
To: ${userName} <${userEmail}>
Subject: ${subject}
Content:
${content}
========================================================================
      `);
    }

    // 3. Update profile with manual report details
    const updates: any = {
      report_sent: true,
      report_content: content,
    };

    if (chakraScores) {
      updates.chakra_scores = chakraScores;
    }

    const { error: updateError } = await supabaseServer
      .from("user_profiles")
      .update(updates)
      .eq("id", leadId);

    if (updateError) {
      return NextResponse.json(
        { success: false, error: "Report processed but failed to update database: " + updateError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Soul report processed successfully.",
      emailSent,
      info: logMessage,
    });
  } catch (error: any) {
    console.error("Error in send-report endpoint:", error);
    return NextResponse.json(
      { success: false, error: "Failed to send manual report: " + error.message },
      { status: 500 }
    );
  }
}
