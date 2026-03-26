import { Injectable, Inject, LoggerService, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { PrismaService } from '../../prisma/prisma.service';
import { randomBytes } from 'crypto';

interface OAuthConfig {
  clientId: string;
  clientSecret: string;
}

interface PlatformProfile {
  platformUserId: string;
  accountName: string;
  accessToken: string;
  refreshToken?: string;
  tokenExpiry?: Date;
}

@Injectable()
export class OAuthService {
  private backendUrl: string;
  private frontendUrl: string;

  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
    @Inject(WINSTON_MODULE_NEST_PROVIDER) private readonly logger: LoggerService,
  ) {
    const port = config.get<number>('port') || 4000;
    this.backendUrl = process.env.BACKEND_URL || `http://localhost:${port}`;
    this.frontendUrl = config.get<string>('frontendUrl') || 'http://localhost:3000';
  }

  private getOAuthConfig(platform: string): OAuthConfig {
    const cfg = this.config.get(`oauth.${platform}`);
    if (!cfg?.clientId) {
      throw new BadRequestException(`not_configured`);
    }
    return cfg;
  }

  isPlatformConfigured(platform: string): boolean {
    const cfg = this.config.get(`oauth.${platform}`);
    return !!(cfg?.clientId && cfg?.clientSecret);
  }

  getConfiguredPlatforms(): Record<string, boolean> {
    const allPlatforms = ['twitter', 'instagram', 'facebook', 'linkedin', 'tiktok', 'youtube', 'pinterest'];
    const result: Record<string, boolean> = {};
    for (const p of allPlatforms) {
      result[p] = this.isPlatformConfigured(p);
    }
    return result;
  }

  private getCallbackUrl(platform: string): string {
    return `${this.backendUrl}/api/accounts/oauth/${platform}/callback`;
  }

  getAuthUrl(platform: string, userId: string): string {
    const oauth = this.getOAuthConfig(platform);
    const state = Buffer.from(JSON.stringify({ userId, platform, nonce: randomBytes(8).toString('hex') })).toString('base64url');
    const callbackUrl = this.getCallbackUrl(platform);

    this.logger.log(`OAuth auth URL requested: ${platform} for user ${userId}`, 'OAuthService');

    switch (platform) {
      case 'twitter':
        // Twitter OAuth 2.0 with PKCE
        const twitterScopes = 'tweet.read tweet.write users.read offline.access';
        return `https://twitter.com/i/oauth2/authorize?response_type=code&client_id=${oauth.clientId}&redirect_uri=${encodeURIComponent(callbackUrl)}&scope=${encodeURIComponent(twitterScopes)}&state=${state}&code_challenge=challenge&code_challenge_method=plain`;

      case 'instagram':
      case 'facebook':
        const fbScopes = platform === 'instagram'
          ? 'instagram_basic,instagram_content_publish,pages_show_list'
          : 'pages_manage_posts,pages_read_engagement,pages_show_list';
        return `https://www.facebook.com/v19.0/dialog/oauth?client_id=${oauth.clientId}&redirect_uri=${encodeURIComponent(callbackUrl)}&scope=${fbScopes}&state=${state}`;

      case 'linkedin':
        const liScopes = 'openid profile w_member_social';
        return `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${oauth.clientId}&redirect_uri=${encodeURIComponent(callbackUrl)}&scope=${encodeURIComponent(liScopes)}&state=${state}`;

      case 'tiktok':
        const ttScopes = 'user.info.basic,video.publish,video.upload';
        return `https://www.tiktok.com/v2/auth/authorize/?client_key=${oauth.clientId}&scope=${ttScopes}&response_type=code&redirect_uri=${encodeURIComponent(callbackUrl)}&state=${state}`;

      case 'youtube':
        const ytScopes = 'https://www.googleapis.com/auth/youtube.upload https://www.googleapis.com/auth/youtube';
        return `https://accounts.google.com/o/oauth2/v2/auth?client_id=${oauth.clientId}&redirect_uri=${encodeURIComponent(callbackUrl)}&response_type=code&scope=${encodeURIComponent(ytScopes)}&access_type=offline&state=${state}`;

      case 'pinterest':
        const pinScopes = 'boards:read,pins:read,pins:write';
        return `https://www.pinterest.com/oauth/?client_id=${oauth.clientId}&redirect_uri=${encodeURIComponent(callbackUrl)}&response_type=code&scope=${pinScopes}&state=${state}`;

      default:
        throw new BadRequestException(`Unsupported platform: ${platform}`);
    }
  }

  async handleCallback(platform: string, code: string, state: string): Promise<string> {
    const stateData = JSON.parse(Buffer.from(state, 'base64url').toString());
    const { userId } = stateData;

    this.logger.log(`OAuth callback received: ${platform} for user ${userId}`, 'OAuthService');

    const profile = await this.exchangeCodeForToken(platform, code);

    // Check if account already connected
    const existing = await this.prisma.account.findFirst({
      where: { userId, platform, platformUserId: profile.platformUserId },
    });

    if (existing) {
      // Update tokens
      await this.prisma.account.update({
        where: { id: existing.id },
        data: {
          accessToken: profile.accessToken,
          refreshToken: profile.refreshToken || existing.refreshToken,
          tokenExpiry: profile.tokenExpiry,
          accountName: profile.accountName,
        },
      });
      this.logger.log(`OAuth account updated: ${platform} ${profile.accountName} for user ${userId}`, 'OAuthService');
    } else {
      // Create new account
      await this.prisma.account.create({
        data: {
          userId,
          platform,
          platformUserId: profile.platformUserId,
          accessToken: profile.accessToken,
          refreshToken: profile.refreshToken,
          tokenExpiry: profile.tokenExpiry,
          accountName: profile.accountName,
        },
      });
      this.logger.log(`OAuth account connected: ${platform} ${profile.accountName} for user ${userId}`, 'OAuthService');
    }

    // Redirect back to frontend accounts page
    return `${this.frontendUrl}/dashboard/accounts?connected=${platform}&name=${encodeURIComponent(profile.accountName)}`;
  }

  private async exchangeCodeForToken(platform: string, code: string): Promise<PlatformProfile> {
    const oauth = this.getOAuthConfig(platform);
    const callbackUrl = this.getCallbackUrl(platform);

    switch (platform) {
      case 'twitter':
        return this.exchangeTwitter(oauth, code, callbackUrl);
      case 'instagram':
      case 'facebook':
        return this.exchangeFacebook(oauth, code, callbackUrl, platform);
      case 'linkedin':
        return this.exchangeLinkedIn(oauth, code, callbackUrl);
      case 'tiktok':
        return this.exchangeTikTok(oauth, code, callbackUrl);
      case 'youtube':
        return this.exchangeYouTube(oauth, code, callbackUrl);
      case 'pinterest':
        return this.exchangePinterest(oauth, code, callbackUrl);
      default:
        throw new BadRequestException(`Unsupported platform: ${platform}`);
    }
  }

  private async exchangeTwitter(oauth: OAuthConfig, code: string, callbackUrl: string): Promise<PlatformProfile> {
    const tokenRes = await fetch('https://api.twitter.com/2/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${Buffer.from(`${oauth.clientId}:${oauth.clientSecret}`).toString('base64')}`,
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: callbackUrl,
        code_verifier: 'challenge',
      }),
    });
    const tokenData = await tokenRes.json();

    const userRes = await fetch('https://api.twitter.com/2/users/me', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    const userData = await userRes.json();

    return {
      platformUserId: userData.data.id,
      accountName: `@${userData.data.username}`,
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token,
      tokenExpiry: tokenData.expires_in ? new Date(Date.now() + tokenData.expires_in * 1000) : undefined,
    };
  }

  private async exchangeFacebook(oauth: OAuthConfig, code: string, callbackUrl: string, platform: string): Promise<PlatformProfile> {
    const tokenRes = await fetch(`https://graph.facebook.com/v19.0/oauth/access_token?client_id=${oauth.clientId}&client_secret=${oauth.clientSecret}&redirect_uri=${encodeURIComponent(callbackUrl)}&code=${code}`);
    const tokenData = await tokenRes.json();

    if (platform === 'instagram') {
      // Get Instagram Business account via Facebook pages
      const pagesRes = await fetch(`https://graph.facebook.com/v19.0/me/accounts?access_token=${tokenData.access_token}`);
      const pagesData = await pagesRes.json();
      const page = pagesData.data?.[0];

      if (page) {
        const igRes = await fetch(`https://graph.facebook.com/v19.0/${page.id}?fields=instagram_business_account&access_token=${tokenData.access_token}`);
        const igData = await igRes.json();
        const igId = igData.instagram_business_account?.id;

        if (igId) {
          const igProfileRes = await fetch(`https://graph.facebook.com/v19.0/${igId}?fields=username&access_token=${tokenData.access_token}`);
          const igProfile = await igProfileRes.json();
          return {
            platformUserId: igId,
            accountName: `@${igProfile.username}`,
            accessToken: tokenData.access_token,
          };
        }
      }
    }

    // Facebook page
    const userRes = await fetch(`https://graph.facebook.com/v19.0/me?access_token=${tokenData.access_token}`);
    const userData = await userRes.json();

    return {
      platformUserId: userData.id,
      accountName: userData.name,
      accessToken: tokenData.access_token,
    };
  }

  private async exchangeLinkedIn(oauth: OAuthConfig, code: string, callbackUrl: string): Promise<PlatformProfile> {
    const tokenRes = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: callbackUrl,
        client_id: oauth.clientId,
        client_secret: oauth.clientSecret,
      }),
    });
    const tokenData = await tokenRes.json();

    const userRes = await fetch('https://api.linkedin.com/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    const userData = await userRes.json();

    return {
      platformUserId: userData.sub,
      accountName: userData.name || userData.email,
      accessToken: tokenData.access_token,
      tokenExpiry: tokenData.expires_in ? new Date(Date.now() + tokenData.expires_in * 1000) : undefined,
    };
  }

  private async exchangeTikTok(oauth: OAuthConfig, code: string, callbackUrl: string): Promise<PlatformProfile> {
    const tokenRes = await fetch('https://open.tiktokapis.com/v2/oauth/token/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_key: oauth.clientId,
        client_secret: oauth.clientSecret,
        code,
        grant_type: 'authorization_code',
        redirect_uri: callbackUrl,
      }),
    });
    const tokenData = await tokenRes.json();

    const userRes = await fetch('https://open.tiktokapis.com/v2/user/info/?fields=open_id,display_name,avatar_url', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    const userData = await userRes.json();

    return {
      platformUserId: tokenData.open_id || userData.data?.user?.open_id,
      accountName: userData.data?.user?.display_name || 'TikTok User',
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token,
      tokenExpiry: tokenData.expires_in ? new Date(Date.now() + tokenData.expires_in * 1000) : undefined,
    };
  }

  private async exchangeYouTube(oauth: OAuthConfig, code: string, callbackUrl: string): Promise<PlatformProfile> {
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: oauth.clientId,
        client_secret: oauth.clientSecret,
        redirect_uri: callbackUrl,
        grant_type: 'authorization_code',
      }),
    });
    const tokenData = await tokenRes.json();

    const channelRes = await fetch('https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    const channelData = await channelRes.json();
    const channel = channelData.items?.[0];

    return {
      platformUserId: channel?.id || 'unknown',
      accountName: channel?.snippet?.title || 'YouTube Channel',
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token,
      tokenExpiry: tokenData.expires_in ? new Date(Date.now() + tokenData.expires_in * 1000) : undefined,
    };
  }

  private async exchangePinterest(oauth: OAuthConfig, code: string, callbackUrl: string): Promise<PlatformProfile> {
    const tokenRes = await fetch('https://api.pinterest.com/v5/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${Buffer.from(`${oauth.clientId}:${oauth.clientSecret}`).toString('base64')}`,
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: callbackUrl,
      }),
    });
    const tokenData = await tokenRes.json();

    const userRes = await fetch('https://api.pinterest.com/v5/user_account', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    const userData = await userRes.json();

    return {
      platformUserId: userData.username || 'unknown',
      accountName: userData.username || 'Pinterest User',
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token,
      tokenExpiry: tokenData.expires_in ? new Date(Date.now() + tokenData.expires_in * 1000) : undefined,
    };
  }
}
