/* eslint-disable @typescript-eslint/no-unsafe-call -- test conveniency */
/* eslint-disable @typescript-eslint/no-unsafe-return -- test conveniency */
/**
 * DISCLAIMER:
 * The tests provided in this file are specifically designed for the `auth` connectors function.
 * Theses tests exists because the services & inngest functions using this connector mock it.
 * If you are using an SDK we suggest you to mock it not to implements calls using msw.
 * These file illustrate potential scenarios and methodologies relevant for SaaS integration.
 */

import { http } from 'msw';
import { describe, expect, test, beforeEach } from 'vitest';
import { env } from '@/env';
import { server } from '../../vitest/setup-msw-handlers';
import { getToken, getRefreshToken } from './auth';
import { HubspotError } from './commons/error';

const validCode = '1234';
const validRefreshToken = '1234';
const accessToken = 'access-token-1234';
const refreshToken = 'refresh-token-1234';
const expiresIn = 60
describe('auth connector', () => {
  describe('getToken', () => {

    // mock token API endpoint using msw
    beforeEach(() => {
      server.use(
        http.post(
          `${env.HUBSPOT_API_BASE_URL}oauth/v1/token`,
          async ({ request }) => {
            // briefly implement API endpoint behaviour
            const body = await request.text();
            const searchParams = new URLSearchParams(body);

            const clientId = searchParams.get('client_id');
            const clientSecret = searchParams.get('client_secret');
            const grantType = searchParams.get('grant_type');
            const redirectURI = searchParams.get('redirect_uri');
            const code = searchParams.get('code');

            if (
              clientId !== env.HUBSPOT_CLIENT_ID ||
              clientSecret !== env.HUBSPOT_CLIENT_SECRET ||
              grantType !== 'authorization_code' ||
              redirectURI !== env.HUBSPOT_REDIRECT_URI || 
              code !== validCode
            ) {
              return new Response(undefined, { status: 401 });
            }
            return Response.json({ access_token: accessToken, refresh_token: refreshToken, expires_in: expiresIn*60 });
          }
        )
      );
    });

    test('should return the accessToken when the code is valid', async () => {
      await expect(getToken(validCode)).resolves.toStrictEqual({accessToken, refreshToken, expiresIn});
    });

    test('should throw when the code is invalid', async () => {
      await expect(getToken('wrong-code')).rejects.toBeInstanceOf(HubspotError);
    });

  });

  describe('getRefreshToken', () => {

    // mock token API endpoint using msw
    beforeEach(() => {
      server.use(
        http.post(
          `${env.HUBSPOT_API_BASE_URL}oauth/v1/token`,
          async ({ request }) => {
            // briefly implement API endpoint behaviour
            const body = await request.text();
            const searchParams = new URLSearchParams(body);

            const clientId = searchParams.get('client_id');
            const clientSecret = searchParams.get('client_secret');
            const refreshTokenInfo = searchParams.get('refresh_token');
            const grantType = searchParams.get('grant_type');

            if (
              clientId !== env.HUBSPOT_CLIENT_ID ||
              clientSecret !== env.HUBSPOT_CLIENT_SECRET ||
              grantType !== 'refresh_token' ||
              refreshTokenInfo !== validRefreshToken
            ) {
              return new Response(undefined, { status: 401 });
            }
            return Response.json({ access_token: accessToken, refresh_token: refreshToken, expires_in: expiresIn*60 });
          }
        )
      );
    });

    test('should return the accessToken when the code is valid', async () => {
      await expect(getRefreshToken(validRefreshToken)).resolves.toStrictEqual({accessToken, refreshToken, expiresIn});
    });

    test('should throw when the code is invalid', async () => {
      await expect(getRefreshToken('wrong-refreshToken')).rejects.toBeInstanceOf(HubspotError);
    });

  });
});
