const nodemailer = require("nodemailer");
const logger = require("./logger");

// ── Transporter ──────────────────────────────────────────────
const createTransporter = () => {
  const config = {
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === "true", // true for 465, false for 587
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    pool: true, // use connection pooling
    maxConnections: 5,
    rateDelta: 1000,
    rateLimit: 5,
  };

  return nodemailer.createTransport(config);
};

let transporter = null;

const getTransporter = () => {
  if (!transporter) transporter = createTransporter();
  return transporter;
};

// ── Verify SMTP on startup ────────────────────────────────────
const verifySMTP = async () => {
  if (!process.env.SMTP_USER || !process.env.SMTP_HOST) {
    logger.warn("SMTP not configured — email notifications disabled");
    return false;
  }
  try {
    await getTransporter().verify();
    logger.info("✅ SMTP server connected");
    return true;
  } catch (err) {
    logger.error(`SMTP verification failed: ${err.message}`);
    return false;
  }
};

// ── Base HTML template ────────────────────────────────────────
const baseTemplate = (content) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Segoe UI', Arial, sans-serif; background: #0E0F13; color: #F0F0F5; }
    .wrapper { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
    .card { background: #14151A; border: 1px solid rgba(255,255,255,0.08); border-radius: 16px; padding: 36px; }
    .logo { display: flex; align-items: center; gap: 10px; margin-bottom: 32px; }
    .logo-icon { width: 40px; height: 40px; border-radius: 10px; background: linear-gradient(135deg,#7C6BF0,#2CC9A0); display: flex; align-items: center; justify-content: center; }
    .logo-text { font-size: 18px; font-weight: 600; color: #F0F0F5; }
    h1 { font-size: 22px; font-weight: 600; margin-bottom: 12px; color: #F0F0F5; }
    p { font-size: 14px; line-height: 1.7; color: #9B9BAD; margin-bottom: 16px; }
    .btn { display: inline-block; padding: 12px 28px; background: #7C6BF0; color: #fff; border-radius: 8px; text-decoration: none; font-size: 14px; font-weight: 600; margin: 8px 0; }
    .divider { height: 1px; background: rgba(255,255,255,0.07); margin: 24px 0; }
    .footer { margin-top: 24px; font-size: 12px; color: #5A5A72; text-align: center; }
    .code { background: #1A1B22; border: 1px solid rgba(255,255,255,0.1); border-radius: 6px; padding: 12px 16px; font-family: monospace; font-size: 24px; letter-spacing: 4px; text-align: center; color: #9B8DF5; margin: 16px 0; }
    .highlight { color: #2CC9A0; font-weight: 600; }
    .warning { color: #F06464; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="card">
      <table cellpadding="0" cellspacing="0" border="0" style="margin-bottom:32px;">
        <tr>
          <td style="width:44px;height:44px;background:linear-gradient(135deg,#7C6BF0,#2CC9A0);border-radius:12px;text-align:center;vertical-align:middle;">
            <span style="font-size:22px;line-height:44px;">⏱</span>
          </td>
          <td style="padding-left:12px;vertical-align:middle;">
            <span style="font-size:18px;font-weight:700;color:#F0F0F5;font-family:'Segoe UI',Arial,sans-serif;letter-spacing:0.5px;">TimeWise</span>
          </td>
        </tr>
      </table>
      ${content}
      <div class="footer">
        <p>© ${new Date().getFullYear()} TimeWise. All rights reserved.</p>
        <p>You received this because you registered at TimeWise.</p>
      </div>
    </div>
  </div>
</body>
</html>`;

// ── Email templates ───────────────────────────────────────────
const sanitize = (str) =>
  str?.replace(
    /[<>&"']/g,
    (c) =>
      ({
        "<": "&lt;",
        ">": "&gt;",
        "&": "&amp;",
        '"': "&quot;",
        "'": "&#39;",
      })[c],
  ) || "";

const templates = {
  welcome: (firstName) => ({
    subject: `Welcome to TimeWise, ${sanitize(firstName)}! 🚀`,
    html: baseTemplate(`
      <h1>Welcome aboard, ${sanitize(firstName)}!</h1>
      <p>Your account has been created successfully. You're ready to start tracking your tasks, habits, and focus sessions.</p>
      <p>Here's what you can do with TimeWise:</p>
      <ul style="color:#9B9BAD;font-size:14px;line-height:2;padding-left:20px;">
        <li>📋 Manage tasks with priorities and due dates</li>
        <li>🍅 Use the Pomodoro timer for deep focus</li>
        <li>⭐ Build daily habits with streak tracking</li>
        <li>📅 Organize your schedule with the calendar</li>
        <li>📊 View productivity analytics</li>
      </ul>
      <div class="divider"></div>
      <a href="${process.env.CLIENT_URL}/dashboard" class="btn">Go to Dashboard →</a>
    `),
    text: `Welcome to TimeWise, ${sanitize(firstName)}!\n\nYour account has been created successfully.\n\nGet started here: ${process.env.CLIENT_URL}/dashboard`,
  }),

  taskReminder: (firstName, taskTitle, dueDate) => ({
    subject: `⏰ Task due soon: ${taskTitle}`,
    html: baseTemplate(`
      <h1>Task Reminder</h1>
      <p>Hi ${firstName}, you have a task due soon:</p>
      <div style="background:#1A1B22;border-left:3px solid #7C6BF0;border-radius:8px;padding:16px;margin:16px 0;">
        <div style="font-size:16px;font-weight:600;color:#F0F0F5;">${taskTitle}</div>
        <div style="font-size:13px;color:#9B9BAD;margin-top:4px;">Due: <span class="warning">${dueDate}</span></div>
      </div>
      <a href="${process.env.CLIENT_URL}/tasks" class="btn">View Task →</a>
    `),
    text: `Hi ${sanitize(firstName)}, your task "${sanitize(taskTitle)}" is due on ${dueDate}.\n\nView it here: ${process.env.CLIENT_URL}/tasks`,
  }),

  habitStreak: (firstName, habitName, streak) => ({
    subject: `🔥 ${streak}-day streak on "${habitName}"!`,
    html: baseTemplate(`
      <h1>Streak milestone! 🎉</h1>
      <p>Amazing work, ${sanitize(firstName)}! You've maintained your <span class="highlight">${habitName}</span> habit for <span class="highlight">${streak} consecutive days</span>.</p>
      <div style="text-align:center;font-size:48px;margin:20px 0;">🔥</div>
      <p>Keep it up — consistency is the key to lasting change!</p>
      <a href="${process.env.CLIENT_URL}/habits" class="btn">View Habits →</a>
    `),
    text: `Amazing work, ${sanitize(firstName)}! You've maintained "${habitName}" for ${streak} consecutive days.\n\nView habits: ${process.env.CLIENT_URL}/habits`,
  }),

  weeklyReport: (firstName, stats) => ({
    subject: `📊 Your weekly TimeWise report`,
    html: baseTemplate(`
      <h1>Weekly Report</h1>
      <p>Hi ${sanitize(firstName)}, here's your productivity summary for the week:</p>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin:20px 0;">
        ${[
          ["Tasks Completed", stats.tasksCompleted, "#7C6BF0"],
          ["Focus Hours", stats.focusHours + "h", "#2CC9A0"],
          ["Habit Rate", stats.habitRate + "%", "#F5A623"],
          ["Pomodoros", stats.pomodoros, "#F06464"],
        ]
          .map(
            ([l, v, c]) => `
          <div style="background:#1A1B22;border-radius:8px;padding:16px;text-align:center;">
            <div style="font-size:10px;text-transform:uppercase;letter-spacing:1px;color:#5A5A72;">${l}</div>
            <div style="font-size:26px;font-weight:600;color:${c};margin-top:4px;">${v}</div>
          </div>
        `,
          )
          .join("")}
      </div>
      <a href="${process.env.CLIENT_URL}/analytics" class="btn">View Full Report →</a>
    `),
    text: `Hi ${sanitize(firstName)}, here's your weekly summary:\n\nTasks Completed: ${stats.tasksCompleted}\nFocus Hours: ${stats.focusHours}h\nHabit Rate: ${stats.habitRate}%\nPomodoros: ${stats.pomodoros}\n\nFull report: ${process.env.CLIENT_URL}/analytics`,
  }),

  passwordReset: (firstName, resetUrl) => ({
    subject: `Reset your TimeWise password`,
    html: baseTemplate(`
      <h1>Password Reset</h1>
      <p>Hi ${sanitize(firstName)}, you requested a password reset. Click the button below to set a new password. This link expires in <span class="warning">10 minutes</span>.</p>
      <a href="${resetUrl}" class="btn">Reset Password →</a>
      <div class="divider"></div>
      <p style="font-size:12px;">If you didn't request this, ignore this email. Your password won't change.</p>
    `),
    text: `Hi ${sanitize(firstName)}, reset your TimeWise password here: ${resetUrl}\n\nThis link expires in 10 minutes.\n\nIf you didn't request this, ignore this email.`,
  }),
};

// ── Send email function ───────────────────────────────────────
const sendEmail = async ({ to, subject, html, text }) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!to || !emailRegex.test(to)) {
    logger.error(`Invalid recipient email: ${to}`);
    return false;
  }

  if (!process.env.SMTP_USER) {
    logger.warn("Email not sent — SMTP not configured");
    return false;
  }

  try {
    const info = await getTransporter().sendMail({
      from: process.env.EMAIL_FROM || `TimeWise <${process.env.SMTP_USER}>`,
      to,
      subject,
      html,
      text: text || html.replace(/<[^>]*>/g, ""),
    });

    logger.info(`Email sent to ${to} — messageId: ${info.messageId}`);
    return true;
  } catch (err) {
    logger.error(`Failed to send email to ${to}: ${err.message}`);
    return false;
  }
};

// ── Convenience senders ───────────────────────────────────────
const sendWelcomeEmail = (user) => {
  if (!user || !user.email || !user.firstName) {
    logger.error("sendWelcomeEmail: missing user email or firstName");
    return false;
  }
  return sendEmail({ to: user.email, ...templates.welcome(user.firstName) });
};

const sendTaskReminder = (user, task) => {
  if (!user || !user.email || !user.firstName) {
    logger.error("sendTaskReminder: missing user email or firstName");
    return false;
  }
  if (!task || !task.title || !task.dueDate) {
    logger.error("sendTaskReminder: missing task title or dueDate");
    return false;
  }
  return sendEmail({
    to: user.email,
    ...templates.taskReminder(user.firstName, task.title, task.dueDate),
  });
};

const sendHabitStreak = (user, habitName, streak) => {
  if (!user || !user.email || !user.firstName) {
    logger.error("sendHabitStreak: missing user email or firstName");
    return false;
  }
  if (!habitName || streak === undefined || streak === null) {
    logger.error("sendHabitStreak: missing habitName or streak");
    return false;
  }
  return sendEmail({
    to: user.email,
    ...templates.habitStreak(user.firstName, habitName, streak),
  });
};

const sendWeeklyReport = (user, stats) => {
  if (!user || !user.email || !user.firstName) {
    logger.error("sendWeeklyReport: missing user email or firstName");
    return false;
  }
  if (
    !stats ||
    stats.tasksCompleted === undefined ||
    stats.focusHours === undefined ||
    stats.habitRate === undefined ||
    stats.pomodoros === undefined
  ) {
    logger.error("sendWeeklyReport: missing or incomplete stats");
    return false;
  }
  return sendEmail({
    to: user.email,
    ...templates.weeklyReport(user.firstName, stats),
  });
};

const sendPasswordReset = (user, url) => {
  if (!url) {
    logger.error("sendPasswordReset called without a reset URL");
    return false;
  }
  return sendEmail({
    to: user.email,
    ...templates.passwordReset(user.firstName, url),
  });
};

const sendPomoNotif = async (user, subject, message) => {
  await sendEmail({
    to: user.email,
    subject,
    html: `<p>Hi ${user.firstName},</p><p>${message}</p>`,
  });
};

const sendCalendarReminder = async (user, event, minutesBefore) => {
  await sendEmail({
    to: user.email,
    subject: `⏰ Reminder: "${event.title}" in ${minutesBefore} min`,
    html: `<p>Hi ${user.firstName},</p><p>Your event <strong>${event.title}</strong> starts in ${minutesBefore} minutes at ${event.startTime}.</p>`,
  });
};

const sendOverdueTask = async (user, task) => {
  await sendEmail({
    to: user.email,
    subject: `⚠️ Overdue Task: ${task.title}`,
    html: `<p>Hi ${user.firstName},</p><p>Your task <strong>${task.title}</strong> is overdue. Please complete it as soon as possible.</p>`,
  });
};

// ── Feedback notification (to admin/owner) ───────────────────
const sendFeedbackEmail = (user, feedback) => {
  const stars = '★'.repeat(feedback.rating) + '☆'.repeat(5 - feedback.rating);
  return sendEmail({
    to: process.env.SMTP_USER, // send to yourself
    subject: `[TimeWise Feedback] ${stars} — ${feedback.category}`,
    html: baseTemplate(`
      <h1>New Feedback Received</h1>
      <p>A user has submitted feedback on TimeWise.</p>
      <div class="divider"></div>

      <p><strong style="color:#F0F0F5">From:</strong> <span class="highlight">${user.firstName} ${user.lastName}</span> (${user.email})</p>
      <p><strong style="color:#F0F0F5">Category:</strong> ${feedback.category}</p>
      <p><strong style="color:#F0F0F5">Rating:</strong> <span style="color:#F5A623;font-size:18px">${stars}</span> (${feedback.rating}/5)</p>

      <div class="divider"></div>

      <p><strong style="color:#F0F0F5">Message:</strong></p>
      <div style="background:#1A1B22;border:1px solid rgba(255,255,255,0.1);border-radius:8px;padding:16px;margin-top:8px;">
        <p style="color:#D0D0E0;margin:0;line-height:1.7">${feedback.message}</p>
      </div>

      <div class="divider"></div>
      <p style="font-size:12px;color:#5A5A72">Submitted on ${new Date(feedback.createdAt).toLocaleString()}</p>
    `),
  });
};

module.exports = {
  sendEmail,
  sendWelcomeEmail,
  sendTaskReminder,
  sendHabitStreak,
  sendWeeklyReport,
  sendPasswordReset,
  verifySMTP,
  sendPomoNotif,
  sendCalendarReminder,
  sendOverdueTask,
  sendFeedbackEmail,
};
