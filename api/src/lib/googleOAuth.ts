interface GoogleTokenResponse {
  access_token: string;
}

interface GoogleUserInfoResponse {
  sub: string;
  email: string;
  name?: string;
  picture?: string;
}

export function buildGoogleOAuthUrl(params: {
  clientId: string;
  redirectUri: string;
  state: string;
}) {
  const url = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  url.searchParams.set('client_id', params.clientId);
  url.searchParams.set('redirect_uri', params.redirectUri);
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('scope', 'openid email profile');
  url.searchParams.set('state', params.state);
  url.searchParams.set('prompt', 'select_account');
  url.searchParams.set('access_type', 'online');
  return url.toString();
}

export async function exchangeCodeForGoogleAccessToken(params: {
  code: string;
  clientId: string;
  clientSecret: string;
  redirectUri: string;
}) {
  const body = new URLSearchParams({
    code: params.code,
    client_id: params.clientId,
    client_secret: params.clientSecret,
    redirect_uri: params.redirectUri,
    grant_type: 'authorization_code',
  });

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {
      'content-type': 'application/x-www-form-urlencoded',
    },
    body,
  });

  if (!res.ok) {
    const errorBody = await res.text();
    throw new Error(`Failed to exchange Google auth code (${res.status}): ${errorBody}`);
  }

  const data = (await res.json()) as GoogleTokenResponse;
  return data.access_token;
}

export async function fetchGoogleUserProfile(accessToken: string) {
  const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
    headers: {
      authorization: `Bearer ${accessToken}`,
    },
  });

  if (!res.ok) {
    throw new Error('Failed to fetch Google user profile');
  }

  const profile = (await res.json()) as GoogleUserInfoResponse;
  return {
    providerUserId: profile.sub,
    email: profile.email,
    name: profile.name ?? null,
    avatarUrl: profile.picture ?? null,
  };
}
