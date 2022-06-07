import axios from 'axios';
import base64 from 'base-64';
import type { WebRTCToken } from '../types/types';

/**
 * Get WebRTC token for registration.\
 * The token has limited lifetime, it can be refreshed by calling .enableIncoming(token) on AculabCloudClient object.
 * @param {WebRTCToken} webRTCToken - A WebRTCToken object
 * @returns {string} WebRTC Token string
 */
export const getToken = async (
  webRTCToken: WebRTCToken
): Promise<string | void> => {
  const username = `${webRTCToken.cloudRegionId}/${webRTCToken.cloudUsername}`;
  const url = 
    `https://ws-${webRTCToken.cloudRegionId}` +
    `.aculabcloud.net/webrtc_generate_token?client_id=${webRTCToken.registerClientId}` +
    `&ttl=${webRTCToken.tokenLifeTime}` +
    `&enable_incoming=${webRTCToken.enableIncomingCall}` +
    `&call_client=${webRTCToken.callClientRange}`;
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': 'Basic ' + base64.encode(`${username}:${webRTCToken.apiAccessKey}`),
  }

  const regToken = axios({
    method: 'get',
    url: url,
    headers: headers,
  })
    .then((response: any) => {
      return response.data.token
    })
    .catch((error: Error) => {
      console.error('[ sendNotification ] error:', error);
    });
  return regToken;
};
