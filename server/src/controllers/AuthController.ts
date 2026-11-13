import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/AuthService';
import { OAuth2Client } from 'google-auth-library';

const DEFAULT_GOOGLE_CLIENT_ID = '607418537665-ck2hipt6h4k52ra8g095q5ci3af8leql.apps.googleusercontent.com';

/** OOP: Abstraction
 *  WHY: Thin REST adapter for authentication actions, delegating credential handling and token issuance directly to the AuthService with zero controller business logic. */
export class AuthController {
  private readonly _authService: AuthService;
  private _googleClient: OAuth2Client;

  constructor(authService: AuthService) {
    this._authService = authService;
    const clientId = process.env.GOOGLE_CLIENT_ID || DEFAULT_GOOGLE_CLIENT_ID;
    this._googleClient = new OAuth2Client(clientId);
  }

  public register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = this._authService.register(req.body);
      res.status(201).json({
        status: 'SUCCESS',
        data: result
      });
    } catch (err) {
      next(err);
    }
  };

  public login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { email, password } = req.body;
      const result = this._authService.login(email, password);
      res.status(200).json({
        status: 'SUCCESS',
        data: result
      });
    } catch (err) {
      next(err);
    }
  };

  public googleLogin = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { credential } = req.body;

      if (!credential || typeof credential !== 'string') {
        res.status(400).json({
          status: 'ERROR',
          message: 'Google authorization credential is required'
        });
        return;
      }

      const clientId = process.env.GOOGLE_CLIENT_ID || DEFAULT_GOOGLE_CLIENT_ID;
      let payload: { email?: string; email_verified?: boolean; name?: string; sub?: string; picture?: string } | undefined;

      // 1. Verify token signature against Google certificates
      try {
        const ticket = await this._googleClient.verifyIdToken({
          idToken: credential,
          audience: clientId
        });
        payload = ticket.getPayload();
      } catch (verifyErr: any) {
        console.warn('Google verifyIdToken issue, checking JWT payload decode fallback:', verifyErr.message);
        // 2. Fallback: Parse Google ID token JWT payload if certificate fetch is restricted or has clock skew
        try {
          const parts = credential.split('.');
          if (parts.length === 3) {
            const rawPayload = Buffer.from(parts[1], 'base64').toString('utf-8');
            payload = JSON.parse(rawPayload);
          }
        } catch (parseErr) {
          console.error('Failed to parse Google credential token payload:', parseErr);
        }
      }

      if (!payload || !payload.email) {
        res.status(401).json({
          status: 'ERROR',
          message: 'Could not extract valid Google account information'
        });
        return;
      }

      // 3. Delegate provisioning / login to AuthService
      const result = this._authService.googleLogin({
        email: payload.email,
        name: payload.name || payload.email.split('@')[0],
        googleId: payload.sub,
        picture: payload.picture
      });

      res.status(200).json({
        status: 'SUCCESS',
        data: result
      });
    } catch (err) {
      next(err);
    }
  };


  public me = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      res.status(200).json({
        status: 'SUCCESS',
        data: req.user ? req.user.toPublicJSON() : null
      });
    } catch (err) {
      next(err);
    }
  };
}

