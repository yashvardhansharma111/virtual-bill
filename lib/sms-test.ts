/**
 * Test file to help find the correct Renflair custom message endpoint
 * 
 * Renflair provides different endpoints for different message types:
 * - V1.php - OTP messages
 * - V3.php - Order confirmation (template - NOT for custom messages)
 * - V4.php - New order notification
 * - V6.php - Recharge confirmation
 * - V7.php - Service booking
 * 
 * For custom messages, you need to contact Renflair support to get:
 * - The correct endpoint (might be V2.php, V5.php, V8.php, or custom)
 * - The correct parameter name (MSG, MESSAGE, TEXT, etc.)
 * 
 * To test, try these endpoints one by one:
 * 1. V2.php?API=xxx&PHONE=xxx&MSG=xxx
 * 2. V5.php?API=xxx&PHONE=xxx&MSG=xxx
 * 3. V8.php?API=xxx&PHONE=xxx&MSG=xxx
 * 
 * Or contact Renflair support for the exact custom message endpoint.
 */

export const RENFLAIR_ENDPOINTS = {
  OTP: 'V1.php',
  ORDER_CONFIRMATION: 'V3.php', // Template - not for custom messages
  NEW_ORDER: 'V4.php',
  RECHARGE: 'V6.php',
  SERVICE_BOOKING: 'V7.php',
  // Try these for custom messages:
  CUSTOM_V2: 'V2.php',
  CUSTOM_V5: 'V5.php',
  CUSTOM_V8: 'V8.php',
};
