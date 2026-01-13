import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import { queryOne, queryAll, execute } from '../db';
import { authenticate, AuthenticatedRequest } from '../middleware/auth';
import { asyncHandler, NotFoundError, BadRequestError } from '../middleware/errorHandler';
import { config } from '../config';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

router.get('/profile', authenticate, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const profile = await queryOne(
    `SELECT p.*, cp.fitness_level, cp.fitness_goals, cp.current_weight_kg, cp.target_weight_kg, cp.height_cm, cp.dietary_restrictions
     FROM profiles p
     LEFT JOIN client_profiles cp ON p.user_id = cp.user_id
     WHERE p.user_id = @userId`,
    { userId: req.user!.id }
  );
  res.json(profile);
}));

router.put('/profile', authenticate, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { full_name, bio, phone, date_of_birth, gender, avatar_url } = req.body;
  await execute(
    `UPDATE profiles SET full_name = COALESCE(@fullName, full_name), bio = COALESCE(@bio, bio), phone = COALESCE(@phone, phone), date_of_birth = COALESCE(@dateOfBirth, date_of_birth), gender = COALESCE(@gender, gender), avatar_url = COALESCE(@avatarUrl, avatar_url), updated_at = GETUTCDATE() WHERE user_id = @userId`,
    { userId: req.user!.id, fullName: full_name, bio, phone, dateOfBirth: date_of_birth, gender, avatarUrl: avatar_url }
  );
  const profile = await queryOne('SELECT * FROM profiles WHERE user_id = @userId', { userId: req.user!.id });
  res.json(profile);
}));

// Get email preferences
router.get('/email-preferences', authenticate, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const prefs = await queryOne(
    `SELECT email_checkin_reminder, email_checkin_submitted, email_checkin_reviewed, 
            email_plan_assigned, email_coach_message, email_marketing
     FROM user_email_preferences WHERE user_id = @userId`,
    { userId: req.user!.id }
  );

  if (!prefs) {
    // Return defaults
    res.json({
      email_checkin_reminder: true,
      email_checkin_submitted: true,
      email_checkin_reviewed: true,
      email_plan_assigned: true,
      email_coach_message: true,
      email_marketing: false,
    });
    return;
  }

  res.json(prefs);
}));

// Update email preferences
router.put('/email-preferences', authenticate, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { 
    email_checkin_reminder, 
    email_checkin_submitted, 
    email_checkin_reviewed,
    email_plan_assigned,
    email_coach_message,
    email_marketing
  } = req.body;

  // Upsert preferences
  const existing = await queryOne('SELECT id FROM user_email_preferences WHERE user_id = @userId', { userId: req.user!.id });

  if (existing) {
    await execute(
      `UPDATE user_email_preferences SET
         email_checkin_reminder = @checkinReminder,
         email_checkin_submitted = @checkinSubmitted,
         email_checkin_reviewed = @checkinReviewed,
         email_plan_assigned = @planAssigned,
         email_coach_message = @coachMessage,
         email_marketing = @marketing,
         updated_at = GETUTCDATE()
       WHERE user_id = @userId`,
      {
        userId: req.user!.id,
        checkinReminder: email_checkin_reminder ? 1 : 0,
        checkinSubmitted: email_checkin_submitted ? 1 : 0,
        checkinReviewed: email_checkin_reviewed ? 1 : 0,
        planAssigned: email_plan_assigned ? 1 : 0,
        coachMessage: email_coach_message ? 1 : 0,
        marketing: email_marketing ? 1 : 0,
      }
    );
  } else {
    await execute(
      `INSERT INTO user_email_preferences (id, user_id, email_checkin_reminder, email_checkin_submitted, email_checkin_reviewed, email_plan_assigned, email_coach_message, email_marketing)
       VALUES (@id, @userId, @checkinReminder, @checkinSubmitted, @checkinReviewed, @planAssigned, @coachMessage, @marketing)`,
      {
        id: uuidv4(),
        userId: req.user!.id,
        checkinReminder: email_checkin_reminder ? 1 : 0,
        checkinSubmitted: email_checkin_submitted ? 1 : 0,
        checkinReviewed: email_checkin_reviewed ? 1 : 0,
        planAssigned: email_plan_assigned ? 1 : 0,
        coachMessage: email_coach_message ? 1 : 0,
        marketing: email_marketing ? 1 : 0,
      }
    );
  }

  res.json({ message: 'Preferences saved' });
}));

// Change password endpoint
router.put('/password', authenticate, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { currentPassword, newPassword } = req.body;

  if (!newPassword || newPassword.length < 6) {
    throw BadRequestError('New password must be at least 6 characters');
  }

  // Get current user with password hash
  const user = await queryOne<{ password_hash: string }>(
    'SELECT password_hash FROM users WHERE id = @userId',
    { userId: req.user!.id }
  );

  if (!user) {
    throw NotFoundError('User not found');
  }

  // If currentPassword is provided, verify it (optional for logged-in users)
  if (currentPassword) {
    const validPassword = await bcrypt.compare(currentPassword, user.password_hash);
    if (!validPassword) {
      throw BadRequestError('Current password is incorrect');
    }
  }

  // Hash new password
  const passwordHash = await bcrypt.hash(newPassword, config.bcrypt.saltRounds);

  // Update password
  await execute(
    'UPDATE users SET password_hash = @hash WHERE id = @userId',
    { hash: passwordHash, userId: req.user!.id }
  );

  // Revoke all other refresh tokens for security
  await execute(
    'UPDATE refresh_tokens SET revoked_at = GETUTCDATE() WHERE user_id = @userId AND revoked_at IS NULL',
    { userId: req.user!.id }
  );

  res.json({ message: 'Password updated successfully' });
}));

export default router;
